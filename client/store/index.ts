import { configureStore } from "@reduxjs/toolkit";

import authUiReducer from "./slices/authUiSlice";
import dashboardReducer from "./slices/dashboardSlice";
import { baseApi } from "./services/baseApi";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    authUi: authUiReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
