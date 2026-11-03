import { TECHNOLOGY_ICONS } from './technology-icon';

const API_ICON_PATTERN = /^[a-z0-9-]{1,40}$/;

describe('TECHNOLOGY_ICONS', () => {
  it('Given the closed list When each icon is checked against the API pattern Then every one is accepted', () => {
    expect({
      checked: TECHNOLOGY_ICONS.length,
      rejected: TECHNOLOGY_ICONS.filter((icon) => !API_ICON_PATTERN.test(icon)),
    }).toEqual({ checked: 6, rejected: [] });
  });
});
