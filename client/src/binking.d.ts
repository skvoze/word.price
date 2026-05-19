declare module 'binking' {
  export default function binking(cardNumber: string): {
    isValid: boolean;
    brandAlias: string | null;
    brandName: string | null;
    brandLogo: string | null;
  };
}