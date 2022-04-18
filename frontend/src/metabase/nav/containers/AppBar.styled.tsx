import styled from "@emotion/styled";

import { color } from "metabase/lib/colors";
import {
  breakpointMaxSmall,
  breakpointMinSmall,
  space,
} from "metabase/styled-components/theme";

import { APP_BAR_HEIGHT } from "../constants";

export const AppBarRoot = styled.header`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: ${APP_BAR_HEIGHT};
  background-color: ${color("bg-white")};
  border-bottom: 1px solid ${color("border")};
  z-index: 4;
`;

export const LogoIconWrapper = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  left: 0;
  padding: ${space(1)};
  margin-left: ${space(1)};
  position: absolute;
  transition: opacity 0.3s;

  &:hover {
    background-color: ${color("bg-light")};
  }
`;

export const SidebarButtonContainer = styled.div`
  left: 7px;
  opacity: 0;
  position: absolute;
  top: 1px;
  transition: opacity 0.3s;
`;

export const RowLeft = styled.div`
  display: flex;
  height: 100%;
  flex-direction: row;
  align-items: center;
  width: 30%;

  &:hover {
    ${LogoIconWrapper} {
      opacity: 0;
    }

    ${SidebarButtonContainer} {
      opacity: 1;
    }
  }
`;

export const RowRight = styled(RowLeft)`
  justify-content: flex-end;
`;

export const SearchBarContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1rem;

  ${breakpointMaxSmall} {
    width: 100%;
  }
`;

export const SearchBarContent = styled.div`
  ${breakpointMaxSmall} {
    width: 100%;
  }

  ${breakpointMinSmall} {
    position: relative;
    width: 500px;
  }
`;
