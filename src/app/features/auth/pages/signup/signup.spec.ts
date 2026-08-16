import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';

import { Signup } from './signup';

import { mapSignupRoleToApiRole } from './signup/resident-role';



describe('Signup', () => {

  let component: Signup;

  let fixture: ComponentFixture<Signup>;



  beforeEach(async () => {

    await TestBed.configureTestingModule({

      imports: [Signup],

      providers: [provideRouter([]), provideHttpClient()]

    }).compileComponents();



    fixture = TestBed.createComponent(Signup);

    component = fixture.componentInstance;

    fixture.detectChanges();

  });



  it('should create', () => {

    expect(component).toBeTruthy();

  });



  it('should default account type to Resident', () => {

    expect(component.accountType).toBe('Resident');

    expect(mapSignupRoleToApiRole(component.accountType)).toBe('Owner');

  });



  it('should map Secretary to Security api role', () => {

    component.accountType = 'Secretary';

    component.onAccountTypeChange();

    expect(mapSignupRoleToApiRole(component.accountType)).toBe('Security');

    expect(component.showUnitDetails).toBeFalse();

  });



  it('should validate step 1 fields for resident', () => {

    component.form.name = 'Resident User';

    component.form.email = 'resident@example.com';

    component.form.wing = 'A';

    component.form.flatNo = 101;

    component.markTouched('name');

    component.markTouched('email');

    component.markTouched('wing');

    component.markTouched('flatNo');



    expect(component.isStep1Valid()).toBeTrue();

  });



  it('should not require wing and flat for secretary', () => {

    component.accountType = 'Secretary';

    component.onAccountTypeChange();

    component.form.name = 'Secretary User';

    component.form.email = 'secretary@example.com';

    component.markTouched('name');

    component.markTouched('email');

    component.markTouched('wing');

    component.markTouched('flatNo');



    expect(component.showUnitDetails).toBeFalse();

    expect(component.getFieldError('wing')).toBeNull();

    expect(component.getFieldError('flatNo')).toBeNull();

    expect(component.isStep1Valid()).toBeTrue();

  });

});


