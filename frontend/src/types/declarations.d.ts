declare module 'lucide-react' {
  import * as React from 'react';
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }
  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  export const Sun: LucideIcon;
  export const Moon: LucideIcon;
  export const Layers: LucideIcon;
  export const LogOut: LucideIcon;
  export const LogIn: LucideIcon;
  export const User: LucideIcon;
  export const UserPlus: LucideIcon;
  export const Shield: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Menu: LucideIcon;
  export const X: LucideIcon;
  export const Activity: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Info: LucideIcon;
  export const Mail: LucideIcon;
  export const Lock: LucideIcon;
  export const Key: LucideIcon;
  export const KeyRound: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Sparkles: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Bell: LucideIcon;
  export const Calendar: LucideIcon;
  export const Edit3: LucideIcon;
  export const Save: LucideIcon;
  export const Server: LucideIcon;
  export const Zap: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const SunMoon: LucideIcon;
  export const Home: LucideIcon;
}

declare module 'react-router-dom' {
  import * as React from 'react';

  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
    replace?: boolean;
    state?: any;
  }

  export const BrowserRouter: React.FC<{ children?: React.ReactNode }>;
  export const Routes: React.FC<{ children?: React.ReactNode }>;
  export const Route: React.FC<{
    path?: string;
    index?: boolean;
    element?: React.ReactNode;
    children?: React.ReactNode;
  }>;
  export const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
  export const Outlet: React.FC;
  export const Navigate: React.FC<{ to: string; state?: any; replace?: boolean }>;

  export function useNavigate(): (to: string | number, options?: { replace?: boolean; state?: any }) => void;
  export function useLocation(): { pathname: string; search: string; hash: string; state: any; key: string };
  export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T;
  export function useSearchParams(): [URLSearchParams, (nextInit: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => void];
}
