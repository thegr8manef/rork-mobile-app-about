#import <React/RCTBridgeModule.h>
#import <Security/Security.h>

@interface RCT_EXTERN_MODULE(SecureSignModule, NSObject)

RCT_EXTERN_METHOD(generateKeyPair:
  (NSString *)deviceId
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(sign:
  (NSString *)payloadBase64
  deviceId:(NSString *)deviceId
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
