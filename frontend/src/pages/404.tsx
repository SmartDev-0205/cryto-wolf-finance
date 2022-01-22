export default function Error404() {
  return (
    <div title="Error 404">
      <div className="error404">
        <div>
          <h1>404</h1>
          <div>
            <h2>This page could not be found.</h2>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .error404 {
            color: #000;
            background: #fff;
            height: 100vh;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .error404 h1 {
            display: inline-block;
            border-right: 1px solid rgba(0, 0, 0, 0.3);
            margin: 0;
            margin-right: 20px;
            padding: 10px 23px 10px 0;
            font-size: 24px;
            font-weight: 500;
            vertical-align: top;
          }
          .error404 div > div {
            display: inline-block;
            text-align: left;
            line-height: 49px;
            height: 49px;
            vertical-align: middle;
          }
          .error404 h2 {
            font-size: 14px;
            font-weight: normal;
            line-height: inherit;
            margin: 0;
            padding: 0;
          }
        `}
      </style>
    </div>
  );
}
