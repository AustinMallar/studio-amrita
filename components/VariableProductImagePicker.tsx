"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import { optionToSwatchColor } from "@/lib/product-swatches";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { ProductVariationView } from "@/types/product-detail";

type Props = {
  productDatabaseId: number;
  productName: string;
  fallbackImageUrl: string;
  fallbackImageAlt: string;
  fallbackPrice: string;
  variations: ProductVariationView[];
  children?: ReactNode;
};

function isRemoteUrl(url: string) {
  return Boolean(url && url.startsWith("http"));
}

export function VariableProductImagePicker({
  productDatabaseId,
  productName,
  fallbackImageUrl,
  fallbackImageAlt,
  fallbackPrice,
  variations,
  children,
}: Props) {
  const formId = useId();
  const [selectedId, setSelectedId] = useState(variations[0]?.id ?? "");

  const selected = useMemo(
    () => variations.find((v) => v.id === selectedId),
    [variations, selectedId]
  );

  const displayImageUrl = (selected?.imageUrl && selected.imageUrl.length > 0
    ? selected.imageUrl
    : fallbackImageUrl) || "";
  const displayImageAlt = selected?.imageAlt || fallbackImageAlt;
  const displayPrice = selected?.price || fallbackPrice;

  if (variations.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <ScrollReveal
        className="relative aspect-square w-full overflow-hidden rounded-3xl bg-blush"
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
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center font-sans text-body">
            No image
          </div>
        )}
      </ScrollReveal>

      <ScrollReveal
        className="flex flex-col gap-6"
        delayMs={90}
        rootMargin="0px 0px 12% 0px"
      >
        <h1 className="font-heading text-3xl text-heading sm:text-4xl">{productName}</h1>
        <p className="font-sans text-xl font-semibold text-heading">{displayPrice}</p>

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
                      backgroundColor: optionToSwatchColor(v.label, `${productName} ${v.label}`),
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

        <AddToCartButton
          productId={productDatabaseId}
          variationId={Number(selectedId)}
          disabled={productDatabaseId <= 0 || !selectedId}
        />

        {children}
      </ScrollReveal>
    </div>
  );
}
