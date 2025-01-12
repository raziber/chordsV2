import { TextInput } from "react-native";

export class FocusManager {
  private static inputRefs: Map<string, TextInput> = new Map();

  static register(key: string, ref: TextInput) {
    this.inputRefs.set(key, ref);
  }

  static unregister(key: string) {
    this.inputRefs.delete(key);
  }

  static focus(key: string) {
    const input = this.inputRefs.get(key);
    if (input) {
      input.focus();
    }
  }
}
