import { createDefine } from "fresh";
import type { AuthUser } from "./lib/types.ts";

export interface SessionState {
  user: AuthUser;
  accessToken: string;
}

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  session: SessionState | null;
}

export const define = createDefine<State>();
