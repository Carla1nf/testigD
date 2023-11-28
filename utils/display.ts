type DollarsOptions = {
  value: number;
  includeSymbol?: boolean;
  decimals?: number;
};

export function dollars({
  value,
  includeSymbol = true,
  decimals = 2,
}: DollarsOptions): string {
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "USD",
    currencyDisplay: includeSymbol ? "symbol" : "code",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };

  const formatter = new Intl.NumberFormat("en-US", options);
  return formatter.format(value);
}
