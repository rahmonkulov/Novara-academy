import type { Metadata } from 'next';
import './globals.css';
import {BRAND} from './brand';
export const metadata:Metadata={title:`${BRAND.name} — ${BRAND.tagline}`,description:'Discover your college fit. Build a personalised university shortlist and an actionable admissions plan.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
