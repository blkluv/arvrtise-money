import React from "react";
import useMetaTags from "react-metatags-hook";
import BannerImage from "../img/banner.png";
import config from "../config";

interface IProps extends React.PropsWithChildren<{}> {
  route: string;
}

const MetaTags: React.FC<IProps> = ({ route, children }) => {
  const configPageMeta = config.pageMeta[route];
  const title = `${configPageMeta.titlePrefix} Monopoly Money`;

  useMetaTags({
    title,
    description: configPageMeta.description,
    charset: "utf-8",
    lang: "en",
    metas: [
      {
        name: "robots",
        content: configPageMeta.index ? "index" : "noindex, nofollow"
      }
    ],
    links: [
      { rel: "canonical", href: config.siteUrl + route },
      { rel: "icon", type: "image/ico", href: "/favicon.ico" },
      { rel: "apple-touch-icon", type: "image/png", href: "/logo.png" }
    ],
    openGraph: {
      title,
      image: config.siteUrl + BannerImage,
      site_name: "Monopoly Money"
    }
  });

  return <>{children}</>;
};

export default MetaTags;
