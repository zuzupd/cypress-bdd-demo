Feature: Car‑wash registration
              As a vehicle owner
              I want to reserve a time slot, select a service package and provide my contact details
So that my car can be washed at my convenience

        Background:
            Given the driver has opened the car‑wash registration page

        Scenario: Successful next‑day registration during opening hours
            Given the driver has selected branch "CHODOV"
              And the driver has selected tomorrows's date
              And the driver has selected time "9:00"
              And the driver has selected the "SHINING" package
              And the driver has entered the following contact details:
                  | Name | Surname | Phone number  | E‑mail           |
                  | Alex | Johnson | +420123456789 | alex@example.com |
             When the driver confirms the registration
             Then a reservation is recorded for branch "CHODOV" at "9:00" today with package "SHINING"