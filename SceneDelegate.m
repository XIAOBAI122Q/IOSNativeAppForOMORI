//
// SceneDelegate.m
// OMORI
//
// Created by Anonym on 20.02.26.
//

#import "SceneDelegate.h"
#import "ViewController.h"

@interface CustomNavigationController : UINavigationController
@end

@implementation CustomNavigationController
- (UIInterfaceOrientationMask)supportedInterfaceOrientations {
	return UIInterfaceOrientationMaskAll;
}
- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation {
	return UIInterfaceOrientationPortrait;
}
@end

@implementation SceneDelegate

- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)connectionOptions {
	if(![scene isKindOfClass:[UIWindowScene class]]) return;

	UIWindowScene *windowScene = (UIWindowScene *)scene;

	self.window = [[UIWindow alloc] initWithWindowScene:windowScene];
	self.window.frame = windowScene.coordinateSpace.bounds;
	self.window.backgroundColor = [UIColor clearColor];

	ViewController *vc = [[ViewController alloc] init];
	
	// 创建一个自定义的NavigationController来支持横屏
	UINavigationController *nav = [[CustomNavigationController alloc] initWithRootViewController:vc];
	nav.navigationBarHidden = YES;

	self.window.rootViewController = nav;
	[self.window makeKeyAndVisible];
}

@end