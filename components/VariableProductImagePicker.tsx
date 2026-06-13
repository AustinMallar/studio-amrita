"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import { optionToSwatchColor } from "@/lib/product-swatches";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductDetailGallery } from "@/components/ProductDetailGallery";
import { ScrollReveal } from "@/components/ScrollReveal";
import type {
  ProductGalleryImage,
  ProductVariationAttribute,
  ProductVariationView,
} from "@/types/product-detail";

type Props = {
  productDatabaseId: number;
  productName: string;
  fallbackImageUrl: string;
  fallbackImageAlt: string;
  fallbackPrice: string;
  variationAttributes: ProductVariationAttribute[];
  variations: ProductVariationView[];
  galleryImages?: ProductGalleryImage[];
  children?: ReactNode;
};

function isRemoteUrl(url: string) {
  return Boolean(url && url.startsWith("http"));
}

function initialAttributeSelection(
  attributes: ProductVariationAttribute[],
  variations: ProductVariationView[],
): Record<string, string> {
  const fromFirst = variations[0]?.attributeValues ?? [];
  if (fromFirst.length > 0) {
    return Object.fromEntries(fromFirst.map((a) => [a.name, a.value]));
  }
  return Object.fromEntries(attributes.map((a) => [a.name, a.options[0] ?? ""]));
}

function findVariationBySelection(
  variations: ProductVariationView[],
  selection: Record<string, string>,
  attributeNames: string[],
) {
  return variations.find((variation) =>
    attributeNames.every((name) => {
      const selected = selection[name];
      return variation.attributeValues.some(
        (attr) => attr.name === name && attr.value === selected,
      );
    }),
  );
}

function isGlowColourAttribute(attr: ProductVariationAttribute) {
  const blob = `${attr.name} ${attr.label}`.toLowerCase();
  return /color|colour|shade|choose-your-glow|choose your glow/.test(blob);
}

const selectClassName =
  "w-full appearance-none rounded-xl border border-black/10 bg-white/70 px-4 py-3 font-sans text-sm text-heading shadow-sm transition focus:border-dusty-rose focus:outline-none focus:ring-2 focus:ring-dusty-rose/30";

export function VariableProductImagePicker({
  productDatabaseId,
  productName,
  fallbackImageUrl,
  fallbackImageAlt,
  fallbackPrice,
  variationAttributes,
  variations,
  galleryImages = [],
  children,
}: Props) {
  const formId = useId();
  const useAttributeDropdowns = variationAttributes.length > 1;

  const [selectedId, setSelectedId] = useState(variations[0]?.id ?? "");
  const [attributeSelection, setAttributeSelection] = useState(() =>
    initialAttributeSelection(variationAttributes, variations),
  );

  const dropdownVariation = useMemo(() => {
    if (!useAttributeDropdowns) return undefined;
    return findVariationBySelection(
      variations,
      attributeSelection,
      variationAttributes.map((a) => a.name),
    );
  }, [useAttributeDropdowns, variations, attributeSelection, variationAttributes]);

  const radioVariation = useMemo(
    () => variations.find((v) => v.id === selectedId),
    [variations, selectedId],
  );

  const selected = useAttributeDropdowns ? dropdownVariation : radioVariation;

  const displayImageUrl =
    (selected?.imageUrl && selected.imageUrl.length > 0
      ? selected.imageUrl
      : fallbackImageUrl) || "";
  const displayImageAlt = selected?.imageAlt || fallbackImageAlt;
  const displayPrice = selected?.price || fallbackPrice;

  if (variations.length === 0) {
    return null;
  }

  function updateAttribute(name: string, value: string) {
    setAttributeSelection((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
      <div className="flex flex-col gap-4">
        <ScrollReveal
          className="relative hidden aspect-square w-full overflow-hidden rounded-3xl bg-blush lg:block"
          rootMargin="0px 0px 12% 0px"
        >
          {displayImageUrl ? (
            isRemoteUrl(displayImageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={displayImageUrl}
                src={displayImageUrl}
                alt={displayImageAlt}
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                key={displayImageUrl}
                src={displayImageUrl}
                alt={displayImageAlt}
                fill
                className="object-cover"
                sizes="50vw"
                priority
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center font-sans text-body">
              No image
            </div>
          )}
        </ScrollReveal>
        <ProductDetailGallery
          mainImageUrl={displayImageUrl || undefined}
          mainImageAlt={displayImageAlt}
          galleryImages={galleryImages}
          mainShownSeparatelyOnDesktop
        />
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <ScrollReveal
          className="flex flex-col gap-6"
          delayMs={90}
          rootMargin="0px 0px 12% 0px"
        >
          <h1 className="font-heading text-3xl text-heading sm:text-4xl">{productName}</h1>
          <p className="font-sans text-xl font-semibold text-heading">{displayPrice}</p>

          {useAttributeDropdowns ? (
            <div className="flex flex-col gap-4">
              {variationAttributes.map((attr) => {
                const selectId = `${formId}-${attr.name}`;
                const showSwatch = isGlowColourAttribute(attr);
                const currentValue = attributeSelection[attr.name] ?? attr.options[0] ?? "";

                return (
                  <div key={attr.name}>
                    <label
                      htmlFor={selectId}
                      className="mb-2 block font-sans text-sm font-semibold uppercase tracking-wide text-body"
                    >
                      {attr.label}
                    </label>
                    <div className="relative">
                      {showSwatch ? (
                        <span
                          className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 rounded-full border border-black/10 ring-2 ring-white"
                          style={{
                            backgroundColor: optionToSwatchColor(
                              currentValue,
                              `${productName} ${currentValue}`,
                            ),
                          }}
                          aria-hidden
                        />
                      ) : null}
                      <select
                        id={selectId}
                        value={currentValue}
                        onChange={(event) => updateAttribute(attr.name, event.target.value)}
                        className={`${selectClassName}${showSwatch ? " pl-11" : ""}`}
                      >
                        {attr.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
              {!selected ? (
                <p className="font-sans text-sm text-body">
                  This combination is not available. Please choose different options.
                </p>
              ) : null}
            </div>
          ) : (
            <fieldset className="border-0 p-0">
              <legend className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-body">
                Choose colour
              </legend>
              <div
                className="flex flex-col gap-3"
                role="radiogroup"
                aria-label={`Colour options for ${productName}`}
              >
                {variations.map((v) => {
                  const inputId = `${formId}-${v.id}`;
                  const checked = selectedId === v.id;
                  return (
                    <label
                      key={v.id}
                      htmlFor={inputId}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 font-sans text-sm transition ${
                        checked
                          ? "border-dusty-rose bg-white/80 shadow-sm ring-1 ring-dusty-rose/40"
                          : "border-black/10 bg-white/50 hover:border-black/20"
                      }`}
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name={`colour-${formId}`}
                        value={v.id}
                        checked={checked}
                        onChange={() => setSelectedId(v.id)}
                        className="h-4 w-4 shrink-0 accent-dusty-rose"
                      />
                      <span
                        className="h-8 w-8 shrink-0 rounded-full border border-black/10 ring-2 ring-white"
                        style={{
                          backgroundColor: optionToSwatchColor(
                            v.label,
                            `${productName} ${v.label}`,
                          ),
                        }}
                        aria-hidden
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="font-semibold text-heading">{v.label}</span>
                        <span className="text-body">{v.price}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <AddToCartButton
            productId={productDatabaseId}
            variationId={selected ? Number(selected.id) : undefined}
            disabled={productDatabaseId <= 0 || !selected?.id}
          />

          {children}
        </ScrollReveal>
      </div>
    </div>
  );
}
