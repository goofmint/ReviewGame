import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { ReactElement } from "react";

export function renderWithRouter(
  ui: ReactElement,
  { route = "/" } = {}
) {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: ui,
      },
    ],
    {
      initialEntries: [route],
    }
  );

  return render(<RouterProvider router={router} />);
}

export * from "@testing-library/react";
