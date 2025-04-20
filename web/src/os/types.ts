// AppStub interface for appStubs array
export interface AppStub {
  id: string;
  title: string;
  icon: string;
  content: () => JSX.Element;
  width: number;
  height: number;
  top: number;
  left: number;
  zIndex: number;
}
