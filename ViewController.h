//
// ViewController.h
// OMORI
//

#ifndef VIEWCONTROLLER_H
#define VIEWCONTROLLER_H

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import "GCDWebServer/GCDWebServer.h"

@interface ViewController : UIViewController <GCDWebServerDelegate, WKNavigationDelegate, WKUIDelegate>

@property (nonatomic, strong) WKWebView *webView;
@property (nonatomic, strong) GCDWebServer *webServer;
@property (nonatomic, copy) NSString *gameRootPath;

@end

#endif /* VIEWCONTROLLER_H */
