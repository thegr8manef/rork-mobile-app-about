declare module "react-native-onboarding-swiper" {
  import * as React from "react";
  import { ViewStyle, TextStyle, ImageStyle } from "react-native";

  export interface OnboardingPage {
    backgroundColor: string;
    image?: React.ReactNode;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
  }

  export interface OnboardingProps {
    pages: OnboardingPage[];
    onSkip?: () => void;
    onDone?: () => void;
    showSkip?: boolean;
    showNext?: boolean;
    showDone?: boolean;
    bottomBarHighlight?: boolean;
    containerStyles?: ViewStyle;
    imageContainerStyles?: ViewStyle;
    titleStyles?: TextStyle;
    subTitleStyles?: TextStyle;
    nextLabel?: React.ReactNode;
    skipLabel?: React.ReactNode;
    doneLabel?: React.ReactNode;
  }

  export default class Onboarding extends React.Component<OnboardingProps> {}
}
