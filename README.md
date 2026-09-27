## Society Configuration Requirements

The supported Society Configuration workflow is:

1. The P360 Team creates the Society Account after the contract/agreement is signed.
2. Society information is captured through the existing Society Name and Location fields.
3. License information is maintained when supported by the backend API.
4. SPOC information is maintained when supported by the backend API.
5. A Society Admin is created through the separate Add Society Admin flow.
6. Wings are configured.
7. Floors are configured against Wings.
8. Flats are configured against Floors and Wings.
9. Society structure is maintained through manual mappings.
10. Residents and Security are handled separately according to the existing application and business requirement.

Generate Structure is currently out of scope and has been removed from the Society Configuration workflow.

### Current Backend Gaps

The current Society create/update API supports only `name` and optional `location`. The following account-registration fields are not exposed by the existing frontend contract and require backend API and persistence support before they can be added safely:

- Chairperson or Secretary Name
- Society Contact Details
- Society KYC
- License Starting Date
- License Validity or Expiry Date
- Activation Status as an account-registration field
- SPOC Name
- SPOC Designation
- SPOC Contact Number

No database, repository, or stored-procedure changes are made by this Angular project.
# RentalUi

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
