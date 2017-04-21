import { inject, TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';

describe('Api Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [ApiService]});
  });

  it('should have the right title', inject([ApiService], (api) => {
    expect(api.title).toBe('Yupeek angular2');
  }));
});
