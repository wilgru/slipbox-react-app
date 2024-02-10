import type { SetURLSearchParams } from "react-router-dom";
import type { URLSearchParams } from "url";

export const handleSpaceBarKeyDown = (
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
  focusedSlipId: string | null
) => {
  if (!focusedSlipId) {
    return;
  }

  if (searchParams.has("openSlip")) {
    searchParams.delete("openSlip");
    setSearchParams(searchParams);

    return;
  }

  searchParams.append("openSlip", focusedSlipId);
  setSearchParams(searchParams);
};
