export const menuItems = [
    { 
      name: 'New Arrivals', 
      link: '/collections/new-arrivals',
      hasDropdown: false 
    },
    { 
      name: 'Best Seller', 
      link: '/collections/best-seller',
      hasDropdown: false 
    },
    { 
      name: 'Lab Grown Silver', 
      link: '/collections/lab-grown-silver',
      hasDropdown: false,
      badge: { text: 'New', color: 'bg-yellow-400' } 
    },
    {
      name: 'Collections',
      link: '/collections',
      hasDropdown: true,
      dropdownContent: [
        {
          title: 'Necklaces',
          items: [
            { name: 'All Necklaces', link: '/collections/necklaces/all' },
            { name: 'Pendant Necklaces', link: '/collections/necklaces/pendant' },
            { name: 'Pearl Necklaces', link: '/collections/necklaces/pearl' },
            { name: 'Statement Necklaces', link: '/collections/necklaces/statement' },
            { name: 'Initials Necklaces', link: '/collections/necklaces/initials' }
          ]
        },
        {
          title: 'Rings',
          items: [
            { name: 'All Rings', link: '/collections/rings/all' },
            { name: 'Statement Rings', link: '/collections/rings/statement' },
            { name: 'Minimal Rings', link: '/collections/rings/minimal' },
            { name: 'Diamond Rings', link: '/collections/rings/diamond' },
            { name: 'Pearl Rings', link: '/collections/rings/pearl' }
          ]
        },
        {
          title: 'Bracelets',
          items: [
            { name: 'All Bracelets', link: '/collections/bracelets/all' },
            { name: 'Charm Bracelets', link: '/collections/bracelets/charm' },
            { name: 'Chain Bracelets', link: '/collections/bracelets/chain' },
            { name: 'Cuff Bracelets', link: '/collections/bracelets/cuff' },
            { name: 'Pearl Bracelets', link: '/collections/bracelets/pearl' }
          ]
        },
        {
          title: 'Earrings',
          items: [
            { name: 'All Earrings', link: '/collections/earrings/all' },
            { name: 'Statement Earrings', link: '/collections/earrings/statement' },
            { name: 'Pearl Earrings', link: '/collections/earrings/pearl' },
            { name: 'Studs', link: '/collections/earrings/studs' },
            { name: 'Danglers', link: '/collections/earrings/danglers' }
          ]
        }
      ]
    },
    { 
      name: 'Shop By', 
      link: '-by',
      hasDropdown: true,
      dropdownContent: [
        {
          title: 'Metal Type',
          items: [
            { name: 'Gold', link: '-by/gold' },
            { name: 'Silver', link: '-by/silver' },
            { name: 'Rose Gold', link: '-by/rose-gold' },
            { name: 'Platinum', link: '-by/platinum' }
          ]
        },
        {
          title: 'Gemstone',
          items: [
            { name: 'Diamond', link: '-by/diamond' },
            { name: 'Pearl', link: '-by/pearl' },
            { name: 'Ruby', link: '-by/ruby' },
            { name: 'Emerald', link: '-by/emerald' },
            { name: 'Sapphire', link: '-by/sapphire' }
          ]
        },
        {
          title: 'Occasion',
          items: [
            { name: 'Wedding', link: '-by/wedding' },
            { name: 'Party', link: '-by/party' },
            { name: 'Casual', link: '-by/casual' },
            { name: 'Office', link: '-by/office' }
          ]
        }
      ]
    },
    { 
      name: 'Gifting', 
      link: '/gifting',
      hasDropdown: false 
    }
  ];