import { Html, Head, Main, NextScript, DocumentProps } from "next/document";
import {
  DocumentHeadTags,
  DocumentHeadTagsProps,
  documentGetInitialProps,
} from '@mui/material-nextjs/v13-pagesRouter';
import React from "react";
const Document = (props:DocumentProps & DocumentHeadTagsProps) => {
  return (
    <Html lang="en">
      <Head>
      <DocumentHeadTags {...props} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}


export const getInitialProps = async (ctx:any) => {
  const finalProps = await documentGetInitialProps(ctx);
  return finalProps;
};

export default Document