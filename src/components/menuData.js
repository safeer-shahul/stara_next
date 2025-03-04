export const menuItems = [
    { 
      name: 'New Arrivals', 
      link: '/new-arrivals',
      hasDropdown: false 
    },
    { 
      name: 'Best Seller', 
      link: '/best-seller',
      hasDropdown: false 
    },
    { 
      name: 'Lab Grown Diamond', 
      link: '/lab-grown-diamond',
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
      link: '/shop-by',
      hasDropdown: true,
      dropdownContent: [
        {
          title: 'Metal Type',
          items: [
            { name: 'Gold', link: '/shop-by/gold' },
            { name: 'Silver', link: '/shop-by/silver' },
            { name: 'Rose Gold', link: '/shop-by/rose-gold' },
            { name: 'Platinum', link: '/shop-by/platinum' }
          ]
        },
        {
          title: 'Gemstone',
          items: [
            { name: 'Diamond', link: '/shop-by/diamond' },
            { name: 'Pearl', link: '/shop-by/pearl' },
            { name: 'Ruby', link: '/shop-by/ruby' },
            { name: 'Emerald', link: '/shop-by/emerald' },
            { name: 'Sapphire', link: '/shop-by/sapphire' }
          ]
        },
        {
          title: 'Occasion',
          items: [
            { name: 'Wedding', link: '/shop-by/wedding' },
            { name: 'Party', link: '/shop-by/party' },
            { name: 'Casual', link: '/shop-by/casual' },
            { name: 'Office', link: '/shop-by/office' }
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