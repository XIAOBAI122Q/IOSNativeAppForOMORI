//
// ViewController.h
// OMORI
//

#ifndef VIEWCONTROLLER_H
#define VIEWCONTROLLER_H

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import "GCDWebServer/GCDWebServer.h"

@interface ViewController : UIViewController <GCDWebServerDelegate, WKNavigationDelegate>

@property (nonatomic, strong) WKWebView *webView;
@property (nonatomic, strong) GCDWebServer *webServer;

@end

#endif /* VIEWCONTROLLER_H */
