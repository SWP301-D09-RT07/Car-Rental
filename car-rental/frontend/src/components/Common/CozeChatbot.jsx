import React, { useEffect } from "react";

const CozeChatbot = () => {
  useEffect(() => {
    // Tạo script tag cho SDK nếu chưa có
    if (!document.getElementById("coze-sdk-script")) {
      const script = document.createElement("script");
      script.id = "coze-sdk-script";
      script.src = "https://sf-cdn.coze.com/obj/unpkg-va/flow-platform/chat-app-sdk/1.2.0-beta.6/libs/oversea/index.js";
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        if (window.CozeWebSDK && !window.__cozeChatbotLoaded) {
          window.CozeWebSDK.WebChatClient && new window.CozeWebSDK.WebChatClient({
            config: { bot_id: "7527350369551876104" },
            componentProps: { title: "Coze" },
            auth: {
              type: "token",
              token: "pat_cMYQu0m1TIdhVM5vf9ydZnmCfrsC4pIz9YnFr2TYbJPxbcv5aUTLTqowJ033N5H5",
              onRefreshToken: function () {
                return "pat_cMYQu0m1TIdhVM5vf9ydZnmCfrsC4pIz9YnFr2TYbJPxbcv5aUTLTqowJ033N5H5";
              }
            }
          });
          window.__cozeChatbotLoaded = true;
        }
      };
    } else if (window.CozeWebSDK && !window.__cozeChatbotLoaded) {
      window.CozeWebSDK.WebChatClient && new window.CozeWebSDK.WebChatClient({
        config: { bot_id: "7527350369551876104" },
        componentProps: { title: "Coze" },
        auth: {
          type: "token",
          token: "pat_cMYQu0m1TIdhVM5vf9ydZnmCfrsC4pIz9YnFr2TYbJPxbcv5aUTLTqowJ033N5H5",
          onRefreshToken: function () {
            return "pat_cMYQu0m1TIdhVM5vf9ydZnmCfrsC4pIz9YnFr2TYbJPxbcv5aUTLTqowJ033N5H5";
          }
        }
      });
      window.__cozeChatbotLoaded = true;
    }
    // Cleanup: không xóa script để tránh reload lại nhiều lần
  }, []);
  return null;
};

export default CozeChatbot; 