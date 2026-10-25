import { createElement, createRef } from "react";
import { CheckIcon, SearchIcon, type IconProps } from "@yz13/icons";
import metadata from "@yz13/icons/metadata";

type Assert<Value extends true> = Value;
type WidthRemoved = Assert<"width" extends keyof IconProps ? false : true>;
type HeightRemoved = Assert<"height" extends keyof IconProps ? false : true>;
type NumericSize = Assert<{ size: number } extends IconProps ? true : false>;
type StringSize = Assert<{ size: string } extends IconProps ? true : false>;

const search = createElement(SearchIcon, {
  size: 20,
  strokeWidth: 1.5,
  "aria-label": "Search",
});
const check = createElement(CheckIcon, {
  size: "1em",
  ref: createRef<SVGSVGElement>(),
});
const title: string = metadata[0].title;
const widthRemoved: WidthRemoved = true;
const heightRemoved: HeightRemoved = true;
const numericSize: NumericSize = true;
const stringSize: StringSize = true;

void [search, check, title, widthRemoved, heightRemoved, numericSize, stringSize];
