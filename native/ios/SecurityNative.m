#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>
#import <dlfcn.h>
#import <sys/sysctl.h>

@interface RCT_EXTERN_MODULE(SecurityNative, NSObject)
@end

@interface SecurityNative : NSObject <RCTBridgeModule>
@end

@implementation SecurityNative

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(getSecuritySignals,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    BOOL debugger = [self isDebuggerAttached];
    BOOL frida = [self isFridaPresent];

    resolve(@{
      @"debugger": @(debugger),
      @"frida": @(frida),
      @"xposed": @(NO) // not relevant on iOS
    });
  } @catch (NSException *exception) {
    reject(@"SECURITY_NATIVE_ERROR", exception.reason, nil);
  }
}

- (BOOL)isDebuggerAttached {
  int mib[4] = {CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()};
  struct kinfo_proc info;
  size_t size = sizeof(info);
  memset(&info, 0, sizeof(info));
  sysctl(mib, 4, &info, &size, NULL, 0);
  return ((info.kp_proc.p_flag & P_TRACED) != 0);
}

- (BOOL)isFridaPresent {
  // Heuristic: detect FridaGadget dylib loaded
  void *handle = dlopen("FridaGadget", RTLD_LAZY);
  if (handle != NULL) {
    dlclose(handle);
    return YES;
  }
  // Also check common substrings in loaded images isn't trivial without private APIs.
  return NO;
}

@end
