/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { primitiveColors } from "./PrimitiveColors";

export const Colors = {
  light: {
    text: primitiveColors.neutral600,
    background: primitiveColors.neutral10,
    backgroundOverlay: primitiveColors.neutral500,
    tint: primitiveColors.neutral0,
    icon: primitiveColors.neutral50,
    tabIconInactive: primitiveColors.neutral40,
    tabIconActive: primitiveColors.neutral100,
  },
  dark: {
    text: primitiveColors.neutral30,
    background: primitiveColors.neutral400,
    backgroundOverlay: primitiveColors.neutral300,
    tint: primitiveColors.neutral80,
    icon: primitiveColors.neutral50,
    tabIconInactive: primitiveColors.neutral60,
    tabIconActive: primitiveColors.neutral10,
  },
};
