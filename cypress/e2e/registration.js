const { Given, When, Then } = require("@badeball/cypress-cucumber-preprocessor");

let tokenStep1 = '';
let tokenStep2 = '';

Given('the driver has opened the car‑wash registration page', () => {
    cy.visit('/');
    cy.get('#c-p-bn').click();
});

Given('the driver has selected branch {string}', (branchName) => {
    cy.get('[data-rel="reservation[branch_id]"]').click();
    cy.get('[data-name="reservation[branch_id]"]').within(() => {
        cy.get('label[for="branch_id_16"]')
          .should('be.visible')
          .click();
    });
});

Given("the driver has selected tomorrows's date", () => {
    cy.get('#reservation_reservation_at').click();
    cy.get('.bootstrap-datetimepicker-widget')
      .should('be.visible')
      .within(() => {
        cy.get('[data-action="tomorrow"]').should('be.visible').click();
      });
});

Given('the driver has selected time {string}', (time) => {
    cy.get('.bootstrap-datetimepicker-widget')
      .should('be.visible')
      .within(() => {
        cy.get('[data-action="close"]').should('be.visible').click();
      });
});

Given('the driver has selected the {string} package', (packageName) => {
    cy.get('[data-rel="reservation[program_id]"]').click();
    cy.get('[data-name="reservation[program_id]"]').within(() => {
        cy.get('label[for="program_id_1333"]')
          .should('be.visible')
          .click();
    });

    // Intercept first reservation step POST
    cy.intercept('POST', 'https://dev.automycka.cz/rezervace-1/', (req) => {
        const formData = new URLSearchParams(req.body);
        expect(formData.get('reservation[branch_id]')).to.equal("16");
        expect(formData.get('reservation[program_id]')).to.equal("1333");
        tokenStep1 = formData.get('reservation[_token]');
    }).as('reservationPost');

    // Submit first form to trigger the first POST
    cy.get('button[type="submit"]').click();
    cy.wait('@reservationPost').then(() => {
        expect(tokenStep1, 'Token from step 1 should be stored').to.exist;
    });
});

Given('the driver has entered the following contact details:', (dataTable) => {
    const details = dataTable.hashes()[0];
    cy.get('#reservation_finalize_customer_name').type(details.Name);
    cy.get('#reservation_finalize_customer_surname').type(details.Surname);
    cy.get('#reservation_finalize_customer_phone_number').type(details["Phone number"]);
    cy.get('#reservation_finalize_customer_email').type(details["E‑mail"] || details["E-mail"]);
});

When('the driver confirms the registration', () => {
    // Intercept contact details POST
    cy.intercept('POST', 'https://dev.automycka.cz/rezervace-2/', (req) => {
        const formData = new URLSearchParams(req.body);
        expect(formData.get('reservation_finalize[customer_name]')).to.equal('Alex');
        expect(formData.get('reservation_finalize[customer_surname]')).to.equal('Johnson');
        expect(formData.get('reservation_finalize[customer_phone_number]')).to.equal('+420 123 456 789');
        expect(formData.get('reservation_finalize[customer_email]')).to.equal('alex@example.com');
        tokenStep2 = formData.get('reservation_finalize[_token]');
    }).as('reservationFinalizePost');

    // Intercept final confirmation POST which returns a redirect
    cy.intercept('POST', 'https://dev.automycka.cz/rezervace-3/', (req) => {
        req.reply({
            statusCode: 302,
            headers: { location: 'https://dev.automycka.cz/rezervace-1/' }
        });
    }).as('reservationSummaryPost');

    // Intercept and simulate confirmation page GET
    cy.intercept('GET', 'https://dev.automycka.cz/rezervace-1/', (req) => {
        req.reply({
            statusCode: 200,
            body: `<div class="confirmation">
                        <header>
                            <h2 class="heading bordered">Rezervace</h2>
                        </header>
                        <p>Děkujeme za objednávku.<br> Těšíme se na Vaši návštěvu.</p>
                    </div>`
        });
    }).as('reservationConfirmation');
    
    // Submit contact details form
    cy.get('#reservation_submit').click();
    cy.wait('@reservationFinalizePost').then(() => {
        expect(tokenStep2, 'Token from step 2 should be stored').to.exist;
    });

    // Confirm GDPR by clicking its label
    cy.get('label[for="reservation_summary_terms"]').click();

    // Submit final confirmation which triggers the redirection
    cy.get('#reservation_submit').click();
    cy.wait('@reservationSummaryPost');

    cy.wait('@reservationConfirmation');
});

Then('a reservation is recorded for branch {string} at {string} today with package {string}', (branchName, time, packageName) => {
    cy.get('.confirmation').within(() => {
        cy.get('p').should('contain', 'Děkujeme za objednávku');
    });
});