import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type DashboardState = {
  selectedCategory: string;
};

const initialState: DashboardState = {
  selectedCategory: "All",
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setSelectedCategory(state, action: PayloadAction<string>) {
      state.selectedCategory = action.payload;
    },
  },
});

export const { setSelectedCategory } = dashboardSlice.actions;

export default dashboardSlice.reducer;
