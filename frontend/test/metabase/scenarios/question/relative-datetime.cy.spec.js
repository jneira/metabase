import moment from "moment";
import _ from "underscore";
import { restore, popover, openOrdersTable } from "__support__/e2e/cypress";

const STARTING_FROM_UNITS = [
  "minutes",
  "hours",
  "days",
  "weeks",
  "months",
  "quarters",
  "years",
];

describe("scenarios > question > relative-datetime", () => {
  const now = moment().utc();

  describe("starting from", () => {
    const date = values =>
      values.reduce((val, [num, unit]) => val.add(num, unit), now.clone());

    beforeEach(() => {
      restore();
      cy.signInAsNormalUser();
    });

    STARTING_FROM_UNITS.forEach(unit =>
      it(`should work with Past filters (${unit} ago)`, () => {
        nativeSQL([
          now,
          date([[-1, unit]]),
          date([[-14, unit]]),
          date([[-15, unit]]),
          date([[-30, unit]]),
        ]);
        withStartingFrom("Past", [10, unit], [10, unit]);
        cy.findByText("Showing 2 rows").should("exist");
      }),
    );

    STARTING_FROM_UNITS.forEach(unit =>
      it(`should work with Next filters (${unit} from now)`, () => {
        nativeSQL([
          now,
          date([[1, unit]]),
          date([[14, unit]]),
          date([[15, unit]]),
          date([[30, unit]]),
        ]);
        withStartingFrom("Next", [10, unit], [10, unit]);
        cy.findByText("Showing 2 rows").should("exist");
      }),
    );

    it("should not clobber filter when value is set to 1", () => {
      openOrdersTable();

      cy.findByTextEnsureVisible("Created At").click();
      cy.findByText("Filter by this column").click();
      cy.intercept("POST", "/api/dataset").as("dataset");
      cy.findByText("Last 30 Days").click();
      cy.wait("@dataset");

      cy.findByText("Created At Previous 30 Days").click();
      cy.findByDisplayValue("30")
        .clear()
        .type(1)
        .blur();
      cy.findByText("day").click();
      popover()
        .last()
        .within(() => cy.findByText("year").click());
      popover().within(() => cy.icon("ellipsis").click());
      popover()
        .last()
        .within(() => cy.findByText("Starting from...").click());
      cy.findAllByDisplayValue("1")
        .last()
        .clear()
        .type(2)
        .blur();
      cy.button("Add filter").should("be.enabled");
    });
  });
});

const nativeSQL = values => {
  cy.intercept("POST", "/api/dataset").as("dataset");

  const queries = values.map(value => {
    const date = moment(value).utc();
    return `SELECT '${date.toISOString()}'::timestamp as "testcol"`;
  });

  cy.createNativeQuestion(
    {
      name: "datetime",
      native: {
        query: queries.join(" UNION ALL "),
      },
    },
    { visitQuestion: true },
  );

  cy.findByText("Explore results").click();
  cy.wait("@dataset");
};

const withStartingFrom = (dir, [num, unit], [startNum, startUnit]) => {
  cy.findByText("testcol").click();
  cy.findByText("Filter by this column").click();
  cy.findByText("Relative dates...").click();
  popover().within(() => {
    cy.findByText(dir).click();
    cy.icon("ellipsis").click();
  });
  popover()
    .last()
    .within(() => cy.findByText("Starting from...").click());
  popover().within(() => cy.findByText("days").click());
  popover()
    .last()
    .within(() => cy.findByText(unit).click());
  popover().within(() => {
    cy.findByText(dir === "Past" ? "days ago" : "days from now").click();
  });
  popover()
    .last()
    .within(() =>
      cy
        .findByText(startUnit + (dir === "Past" ? " ago" : " from now"))
        .click(),
    );

  popover().within(() => {
    cy.findAllByDisplayValue("30")
      .clear()
      .type(num);
    cy.findAllByDisplayValue("7")
      .clear()
      .type(startNum);
  });

  cy.intercept("POST", "/api/dataset").as("dataset");
  popover().within(() => cy.findByText("Add filter").click());
  cy.wait("@dataset");
};
