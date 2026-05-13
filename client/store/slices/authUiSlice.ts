import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthMode = "login" | "register";

type AuthUiState = {
  mode: AuthMode;
  loading: boolean;
  error: string;
};

const initialState: AuthUiState = {
  mode: "login",
  loading: false,
  error: "",
};

const authUiSlice = createSlice({
  name: "authUi",
  initialState,
  reducers: {
    setAuthMode(state, action: PayloadAction<AuthMode>) {
      state.mode = action.payload;
      state.error = "";
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    resetAuthUi(state) {
      state.error = "";
      state.loading = false;
    },
  },
});

export const { resetAuthUi, setAuthError, setAuthLoading, setAuthMode } = authUiSlice.actions;

export default authUiSlice.reducer;
