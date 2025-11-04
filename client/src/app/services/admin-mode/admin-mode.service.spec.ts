import { TestBed } from '@angular/core/testing';

import { AdminModeService } from './admin-mode.service';

describe('AdminModeService', () => {
  let service: AdminModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
