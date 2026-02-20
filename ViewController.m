//
// ViewController.m
// OMORI
//

#import "ViewController.h"
#import "GCDWebServer/GCDWebServer.h"
#import <WebKit/WebKit.h>
#import <CoreGraphics/CoreGraphics.h>

@implementation ViewController

- (void)viewDidLoad {
	[super viewDidLoad];
	self.view.backgroundColor = [UIColor clearColor];
	[self createWebView];
	[self startServer];
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations {
	return UIInterfaceOrientationMaskAll;
}

- (BOOL)shouldAutorotate {
	return YES;
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation {
	return UIInterfaceOrientationPortrait;
}

#pragma mark - WebView

- (void)createWebView {
	WKUserContentController *userContentController = [[WKUserContentController alloc] init];
	// 屏蔽所有 JS 报错，保证 WebView 继续运行
	NSString *js = @"(function() {"
	"window.onerror = function() { return true; };"
	"window.addEventListener('error', function() { return true; }, true);"
	"window.addEventListener('unhandledrejection', function(e) { e.preventDefault(); }, true);"
	"})();";
	WKUserScript *userScript = [[WKUserScript alloc] initWithSource:js
	                                                   injectionTime:WKUserScriptInjectionTimeAtDocumentStart
	                                                forMainFrameOnly:NO];
	[userContentController addUserScript:userScript];

	WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
	config.allowsInlineMediaPlayback = YES;
	config.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;
	config.userContentController = userContentController;
	if (@available(iOS 14.0, *)) {
		config.defaultWebpagePreferences.allowsContentJavaScript = YES;
	} else {
		config.preferences.javaScriptEnabled = YES;
	}

	self.webView = [[WKWebView alloc] initWithFrame:(CGRect){0,0,0,0} configuration:config];
	self.webView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
	self.webView.backgroundColor = [UIColor blackColor];
	self.webView.opaque = YES;
	self.webView.navigationDelegate = self;
	self.webView.scrollView.bounces = NO;
	self.webView.scrollView.backgroundColor = [UIColor blackColor];
	[self.view addSubview:self.webView];
}

- (void)viewDidLayoutSubviews {
	[super viewDidLayoutSubviews];
	self.webView.frame = self.view.bounds;
}

- (void)loadGameURL {
	NSString *urlString = @"http://127.0.0.1:9000/";
	NSURL *url = [NSURL URLWithString:urlString];
	if (!url) return;
	NSURLRequest *request = [NSURLRequest requestWithURL:url
	                                         cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
	                                     timeoutInterval:30];
	[self.webView loadRequest:request];
}

#pragma mark - 文件与服务器

- (void)startServer {
	NSString *gameRootPath = [self resolveGameRootPath];
	if (!gameRootPath) {
		NSLog(@"[OMORI] 未找到可用的 index.html，无法启动 Web 服务器");
		return;
	}
	[self startWebServerWithRootPath:gameRootPath];
}

- (NSString *)resolveGameRootPath {
	NSFileManager *fm = [NSFileManager defaultManager];
	NSString *bundlePath = [[NSBundle mainBundle] bundlePath];
	NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
	NSString *documentsPath = [paths firstObject];

	NSArray<NSString *> *candidates = @[
		[documentsPath stringByAppendingPathComponent:@"Resources"],
		documentsPath,
		[bundlePath stringByAppendingPathComponent:@"Resources"],
		bundlePath
	];

	for (NSString *candidate in candidates) {
		NSString *indexPath = [candidate stringByAppendingPathComponent:@"index.html"];
		if ([fm fileExistsAtPath:indexPath]) {
			NSLog(@"[OMORI] 使用静态资源目录: %@", candidate);
			return candidate;
		}
	}

	return nil;
}

- (void)startWebServerWithRootPath:(NSString *)rootPath {
	// 服务器在包含 index.html 的根目录打开
	NSDictionary *options = @{
		GCDWebServerOption_Port: @9000,
		GCDWebServerOption_BindToLocalhost: @YES,
	};
	self.webServer = [[GCDWebServer alloc] init];
	self.webServer.delegate = self;

	[self.webServer addGETHandlerForBasePath:@"/" directoryPath:rootPath indexFilename:@"index.html" cacheAge:0 allowRangeRequests:YES];

	__weak typeof(self) weakSelf = self;
	[self.webServer addHandlerWithMatchBlock:^GCDWebServerRequest *(NSString *requestMethod, NSURL *requestURL, NSDictionary<NSString *,NSString *> *requestHeaders, NSString *urlPath, NSDictionary<NSString *,NSString *> *urlQuery) {
		if (![requestMethod isEqualToString:@"GET"] && ![requestMethod isEqualToString:@"HEAD"]) return nil;
		return [[GCDWebServerRequest alloc] initWithMethod:requestMethod url:requestURL headers:requestHeaders path:urlPath query:urlQuery];
	} processBlock:^GCDWebServerResponse *(GCDWebServerRequest *request) {
		return [weakSelf handleStaticFileRequest:request withDocumentsPath:rootPath];
	}];

	[self.webServer startWithOptions:options error:nil];
}

- (void)webServerDidStart:(GCDWebServer *)server {
	[self loadGameURL];
}

#pragma mark - HTTP 请求处理

- (GCDWebServerResponse *)handleStaticFileRequest:(GCDWebServerRequest *)request withDocumentsPath:(NSString *)documentsPath {
	NSString *requestPath = request.path;

	if ([requestPath isEqualToString:@"/"] || requestPath.length == 0) {
		NSString *indexPath = [documentsPath stringByAppendingPathComponent:@"index.html"];
		return [self createFileResponseForPath:indexPath];
	}

	if ([requestPath hasPrefix:@"/"]) {
		requestPath = [requestPath substringFromIndex:1];
	}
	requestPath = [requestPath stringByRemovingPercentEncoding] ?: request.path;
	if ([requestPath hasPrefix:@"/"]) {
		requestPath = [requestPath substringFromIndex:1];
	}

	NSString *filePath = [documentsPath stringByAppendingPathComponent:requestPath];
	NSFileManager *fm = [NSFileManager defaultManager];
	BOOL isDir = NO;

	if ([fm fileExistsAtPath:filePath isDirectory:&isDir]) {
		if (!isDir) {
			// 返回文件响应，支持Range请求
			return [self createFileResponseForPath:filePath];
		} else {
			// 如果是目录，尝试查找index.html
			NSString *indexPath = [filePath stringByAppendingPathComponent:@"index.html"];
			if ([fm fileExistsAtPath:indexPath]) {
				return [self createFileResponseForPath:indexPath];
			}
			// 返回目录列表
			return [self createDirectoryListingForPath:filePath];
		}
	}
	
	NSString *found = [self findFileCaseInsensitive:filePath inDirectory:documentsPath];
	if (found) {
		return [self createFileResponseForPath:found];
	}
	
	// 文件未找到
	return [GCDWebServerErrorResponse responseWithClientError:kGCDWebServerHTTPStatusCode_NotFound message:@"文件未找到: %@", requestPath];
}

- (GCDWebServerResponse *)createDirectoryListingForPath:(NSString *)directoryPath {
	NSFileManager *fm = [NSFileManager defaultManager];
	NSArray *contents = [fm contentsOfDirectoryAtPath:directoryPath error:nil];
	if (!contents) {
		return [GCDWebServerErrorResponse responseWithClientError:kGCDWebServerHTTPStatusCode_NotFound message:@"目录不存在"];
	}
	NSMutableString *html = [NSMutableString stringWithString:@"<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>文件列表</title></head><body><ul>"];
	for (NSString *item in contents) {
		NSString *itemPath = [directoryPath stringByAppendingPathComponent:item];
		BOOL isDir = NO;
		[fm fileExistsAtPath:itemPath isDirectory:&isDir];
		NSString *escaped = [item stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLPathAllowedCharacterSet]] ?: item;
		if (isDir) {
			[html appendFormat:@"<li><a href=\"%@/\">%@/</a></li>", escaped, item];
		} else {
			[html appendFormat:@"<li><a href=\"%@\">%@</a></li>", escaped, item];
		}
	}
	[html appendString:@"</ul></body></html>"];
	return [GCDWebServerDataResponse responseWithHTML:html];
}

- (NSString *)findFileCaseInsensitive:(NSString *)requestedPath inDirectory:(NSString *)baseDirectory {
	NSFileManager *fm = [NSFileManager defaultManager];
	NSString *relativePath = [requestedPath substringFromIndex:baseDirectory.length];
	if ([relativePath hasPrefix:@"/"]) {
		relativePath = [relativePath substringFromIndex:1];
	}
	NSArray *components = [relativePath pathComponents];
	if (components.count == 0) return nil;

	NSString *currentPath = baseDirectory;
	for (NSUInteger i = 0; i < components.count; i++) {
		NSString *component = components[i];
		NSArray *contents = [fm contentsOfDirectoryAtPath:currentPath error:nil];
		if (!contents) return nil;
		NSString *foundItem = nil;
		for (NSString *item in contents) {
			if ([item caseInsensitiveCompare:component] == NSOrderedSame) {
				foundItem = item;
				break;
			}
		}
		if (!foundItem) return nil;
		currentPath = [currentPath stringByAppendingPathComponent:foundItem];
		BOOL isDir = NO;
		[fm fileExistsAtPath:currentPath isDirectory:&isDir];
		if (!isDir && i == components.count - 1) return currentPath;
		if (isDir && i == components.count - 1) {
			NSString *idx = [currentPath stringByAppendingPathComponent:@"index.html"];
			if ([fm fileExistsAtPath:idx]) return idx;
		}
	}
	return currentPath;
}

- (GCDWebServerResponse *)createFileResponseForPath:(NSString *)filePath {
	// 检查文件是否存在
	NSFileManager *fm = [NSFileManager defaultManager];
	if (![fm fileExistsAtPath:filePath]) {
		return [GCDWebServerErrorResponse responseWithClientError:kGCDWebServerHTTPStatusCode_NotFound message:@"文件不存在"];
	}
	
	// 创建文件响应，自动支持Range请求
	GCDWebServerFileResponse *response = [GCDWebServerFileResponse responseWithFile:filePath];
	
	// 设置正确的MIME类型
	NSString *extension = [[filePath pathExtension] lowercaseString];
	NSString *mimeType = [self getMimeTypeForExtension:extension];
	if (mimeType) {
		response.contentType = mimeType;
	}
	
	// 设置缓存策略
	response.cacheControlMaxAge = 0; // 不缓存
	response.lastModifiedDate = [NSDate distantPast];
	response.eTag = @"";
	
	// 启用Range请求支持
	[response setValue:@"bytes" forAdditionalHeader:@"Accept-Ranges"];
	
	return response;
}

- (NSString *)getMimeTypeForExtension:(NSString *)extension {
	// RPG Maker / OMORI 常用文件类型的MIME映射
	NSDictionary *mimeTypes = @{
		// HTML
		@"html": @"text/html",
		@"htm": @"text/html",
		
		// JavaScript
		@"js": @"application/javascript",
		@"mjs": @"application/javascript",
		
		// CSS
		@"css": @"text/css",
		
		// 图片
		@"png": @"image/png",
		@"jpg": @"image/jpeg",
		@"jpeg": @"image/jpeg",
		@"gif": @"image/gif",
		@"bmp": @"image/bmp",
		@"webp": @"image/webp",
		
		// 音频 (RPG Maker常用)
		@"ogg": @"audio/ogg",
		@"oga": @"audio/ogg",
		@"wav": @"audio/wav",
		@"mp3": @"audio/mpeg",
		@"m4a": @"audio/mp4",
		
		// 视频
		@"mp4": @"video/mp4",
		@"webm": @"video/webm",
		
		// 字体
		@"woff": @"font/woff",
		@"woff2": @"font/woff2",
		@"ttf": @"font/ttf",
		@"otf": @"font/otf",
		
		// JSON
		@"json": @"application/json",
		
		// XML
		@"xml": @"application/xml",
		
		// 文本
		@"txt": @"text/plain",
		@"md": @"text/markdown",
		
		// 压缩文件
		@"zip": @"application/zip",
		@"rar": @"application/x-rar-compressed",
		
		// RPG Maker MV/MZ 特定文件
		@"rpgmvp": @"application/octet-stream",
		@"rpgmvm": @"application/octet-stream",
		@"rpgmvz": @"application/octet-stream",
		@"rmmz": @"application/octet-stream",
		@"rgssad": @"application/octet-stream",
		@"rgss2a": @"application/octet-stream",
		@"rgss3a": @"application/octet-stream"
	};
	
	return mimeTypes[extension];
}

#pragma mark - WKNavigationDelegate

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
}

- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)navigation withError:(NSError *)error {
	if (error.code == NSURLErrorNotConnectedToInternet ||
	    error.code == NSURLErrorNetworkConnectionLost ||
	    error.code == NSURLErrorTimedOut) {
		dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(3.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
			NSURL *url = webView.URL;
			if (url) {
				NSURLRequest *request = [NSURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringLocalCacheData timeoutInterval:30.0];
				[webView loadRequest:request];
			}
		});
	}
}

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error {
}

- (void)webView:(WKWebView *)webView didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential * _Nullable))completionHandler {
	completionHandler(NSURLSessionAuthChallengeUseCredential, nil);
}

- (void)webView:(WKWebView *)webView didReceiveServerRedirectForProvisionalNavigation:(WKNavigation *)navigation {
}

- (void)dealloc {
	[self.webServer stop];
}

@end
