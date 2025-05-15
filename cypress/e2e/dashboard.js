const { When, Then } = require("@badeball/cypress-cucumber-preprocessor");

When("I navigate to the application", () => {
    cy.visit("/")
})

Then("dashboard is displayed", () => {
    cy.get(".page-header").within(() => {
        cy.get(".site-logo").within(() => {
            cy.get('img').should('have.attr', 'src', '/images/frontend/site-logo.svg')
        })
    })
})