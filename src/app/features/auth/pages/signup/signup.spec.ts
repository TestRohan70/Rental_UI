import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Signup } from './signup';

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

  it('should validate step 1 fields', () => {
    component.form.name = '';
    component.markTouched('name');
    expect(component.getFieldError('name')).toBeTruthy();

    component.form.role = '';
    component.markTouched('role');
    expect(component.getFieldError('role')).toBe('Please select your role.');
  });

  it('should not require wing and flat for security role', () => {
    component.form.role = 'Security';
    component.onRoleChange();
    component.markTouched('wing');
    component.markTouched('flatNo');

    expect(component.showUnitDetails).toBeFalse();
    expect(component.getFieldError('wing')).toBeNull();
    expect(component.getFieldError('flatNo')).toBeNull();
    expect(component.isStep1Valid()).toBeFalse();

    component.form.name = 'Security Guard';
    component.form.email = 'guard@example.com';
    component.markTouched('name');
    component.markTouched('email');

    expect(component.isStep1Valid()).toBeTrue();
  });
});
