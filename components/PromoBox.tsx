import AffiliateButton from "./AffiliateButton";

/**
 * Promo box shown at the bottom of every article. Works for any link at
 * all — your own product, someone else's affiliate program, anything.
 * Just edit these two lines:
 */
const PROMO_TEXT = "Check out our recommended pick.";
const PROMO_LINK = "PUT YOUR LINK HERE";
const PROMO_BUTTON_LABEL = "Learn more";

export default function PromoBox() {
  return (
    <div className="my-8 flex items-center justify-between gap-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {PROMO_TEXT}
      </p>
      <AffiliateButton label={PROMO_BUTTON_LABEL} href={PROMO_LINK} />
    </div>
  );
}
