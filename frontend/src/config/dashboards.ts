import {
  BarChart3, ShoppingCart,
  LayoutDashboard, Earth, PackageSearch, ShipWheel,
  DollarSign, Users2, ClipboardList, Package,
  type LucideIcon,
} from 'lucide-react';

export interface SubRoute {
  name:  string;
  path:  string;
  icon:  LucideIcon;
  label: string;
}

export interface MasterDashboard {
  key:         string;
  title:       string;
  description: string;
  icon:        LucideIcon;
  gradient:    string;
  glow:        string;
  stats:       string;
  defaultPath: string;
  subRoutes:   SubRoute[];
  /**
   * Logical datasource key this dashboard requires.
   * Admin must add a datasource tagged with this exact key for the org.
   * Charts only render when the org's active datasource matches this key.
   * Set to null to always render (no datasource check).
   */
  requiredDatasourceKey: string | null;
  /**
   * Companies that have access to this dashboard.
   * Must match the `company` field in seed_users.py.
   * Used for developer reference only — actual access is enforced
   * by the `dashboards` field on the user row in the database.
   */
  assignedTo: string[];
}

// ─── Master Dashboard Registry ────────────────────────────────────────────────
// Each key here must match the string used in seed_users.py → dashboards: [...]
// ─────────────────────────────────────────────────────────────────────────────

export const MASTER_DASHBOARDS: Record<string, MasterDashboard> = {

  // ── Sales Dashboard ────────────────────────────────────────────────────────
  sales: {
    key:         'sales',
    title:       'Sales Dashboard',
    description: 'Executive overview, product performance, geographic analysis and shipping operations — all in one place.',
    icon:        BarChart3,
    gradient:    'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    glow:        'rgba(59,130,246,0.35)',
    stats:       '4 dashboards · Live data',
    defaultPath: '/sales/executive',
    subRoutes: [
      { name: 'Executive Sales', path: '/sales/executive', icon: LayoutDashboard, label: 'Overview'     },
      { name: 'Geography',       path: '/sales/geography', icon: Earth,            label: 'Markets'      },
      { name: 'Products',        path: '/sales/products',  icon: PackageSearch,    label: 'Performance'  },
      { name: 'Shipping Ops',    path: '/sales/shipping',  icon: ShipWheel,        label: 'Operations'   },
    ],
    requiredDatasourceKey: 'sales_db',
    assignedTo: [
      'Nexus Analytics',   // admin@nexus.com
      'Acme Corp',         // client@acmecorp.com
    ],
  },

  // ── Procurement Dashboard ──────────────────────────────────────────────────
  procurement: {
    key:         'procurement',
    title:       'Procurement Dashboard',
    description: 'Spend analysis, supplier performance, purchase orders and inventory — full procurement intelligence in one place.',
    icon:        ShoppingCart,
    gradient:    'linear-gradient(135deg, #10B981, #059669)',
    glow:        'rgba(16,185,129,0.35)',
    stats:       '4 dashboards · Live data',
    defaultPath: '/procurement/spend',
    subRoutes: [
      { name: 'Spend Overview',       path: '/procurement/spend',    icon: DollarSign,    label: 'Analysis'     },
      { name: 'Supplier Performance', path: '/procurement/supplier', icon: Users2,         label: 'Suppliers'    },
      { name: 'Purchase Orders',      path: '/procurement/orders',   icon: ClipboardList,  label: 'Orders'       },
      { name: 'Inventory Analysis',   path: '/procurement/inventory',icon: Package,        label: 'Inventory'    },
    ],
    requiredDatasourceKey: 'procurement_db',
    assignedTo: [
      // Add company names here once you assign procurement access
      // e.g. 'Acme Corp',
      'Acme Corp',
    ],
  },

  // ── Template for future dashboards ────────────────────────────────────────
  // example: {
  //   key:         'example',
  //   title:       'Example Dashboard',
  //   description: 'Description of what this dashboard covers.',
  //   icon:        BarChart3,
  //   gradient:    'linear-gradient(135deg, #F59E0B, #EF4444)',
  //   glow:        'rgba(245,158,11,0.35)',
  //   stats:       'N dashboards · Live data',
  //   defaultPath: '/example/overview',
  //   subRoutes:   [],
  //   requiredDatasourceKey: 'example_db',   // tag admin must set on the datasource
  //   assignedTo:  ['Company Name'],
  // },

};

// ─── Company → Dashboards lookup (derived from above) ────────────────────────
// Quick reference: which dashboards does a given company have access to?
// ─────────────────────────────────────────────────────────────────────────────

export const COMPANY_DASHBOARD_MAP: Record<string, string[]> = Object.values(
  MASTER_DASHBOARDS,
).reduce<Record<string, string[]>>((acc, dashboard) => {
  dashboard.assignedTo.forEach((company) => {
    if (!acc[company]) acc[company] = [];
    acc[company].push(dashboard.key);
  });
  return acc;
}, {});

/*
  COMPANY_DASHBOARD_MAP at runtime:
  {
    'Nexus Analytics': ['sales'],
    'Acme Corp':       ['sales'],
  }

  To add a new client with procurement access:
    1. Add their company name to procurement.assignedTo above
    2. Add the user in backend/seed_users.py with dashboards: ['procurement']
    3. Run: python seed_users.py
*/
