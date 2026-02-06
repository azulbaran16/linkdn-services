import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
  prefixes: ['linkdn-services://', 'https://linkdn-services.co'],
  config: {
    screens: {
      ManageBooking: {
        path: 'booking/manage/:token',
      },
    },
  },
};
