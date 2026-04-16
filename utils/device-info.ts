import DeviceInfo from "react-native-device-info";

export const getDeviceMetaData = async () => {
  const manufacturer = await DeviceInfo.getManufacturer();

  return {
    os: DeviceInfo.getSystemName(),          
    osVersion: DeviceInfo.getSystemVersion(),
    model: DeviceInfo.getModel(),            
    manufacturer,                            
    appVersion: DeviceInfo.getVersion() };
};


export const getDeviceId = async () => {
  return await DeviceInfo.getUniqueId();
};
