import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { SocietyConfigurationService } from '../../../core/services/society-configuration.service';

describe('SocietyConfigurationService', () => {
  it('should build a valid PmAccount payload with multiple SPCs array without backend-managed fields', () => {
    const payload = SocietyConfigurationService.prototype.buildPmAccountPayload.call({} as any, {
      socName: 'ABC Society',
      email: 'abc@gmail.com',
      phone: '9876543210',
      spcs: [
        {
          name: 'Rohan',
          designation: 'Secretary',
          contact: '9876543211'
        },
        {
          name: 'Amit',
          designation: 'Chairman',
          contact: '9876543222'
        },
        {
          name: 'Priya',
          designation: 'Treasurer',
          contact: '9876543233'
        }
      ]
    });

    expect(payload).toEqual({
      socName: 'ABC Society',
      email: 'abc@gmail.com',
      phone: '9876543210',
      isActive: true,
      spcDtl: [
        {
          Name: 'Rohan',
          Designation: 'Secretary',
          Contact: '9876543211'
        },
        {
          Name: 'Amit',
          Designation: 'Chairman',
          Contact: '9876543222'
        },
        {
          Name: 'Priya',
          Designation: 'Treasurer',
          Contact: '9876543233'
        }
      ]
    });
  });
});
