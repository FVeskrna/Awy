import { useDeviceContext } from '../context/DeviceContext';

export const useDevice = () => {
    return useDeviceContext();
};
