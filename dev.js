import * as dotenv from "dotenv";
import { Server } from "@remote-kakao/core";
import https from "follow-redirects/https.js";

dotenv.config({ path: "./.env" });
console.log(process.env.OPENAI_API);
const server = new Server({ useKakaoLink: false });

const options = {
	method: "POST",
	hostname: "api.openai.com",
	path: "/v1/chat/completions",
	headers: {
		"Content-Type": "application/json",
		Authorization: process.env.OPENAI_API,
	},
	maxRedirects: 20,
};

var allMsg = [];

server.on("message", async (msg) => {
	// Get room type, if matched, proceed
	if (msg.sender.name == "shane.") {
		console.log(msg.sender.name + " : " + msg.content);

		if (msg.content.startsWith("?")) {
			allMsg[msg.sender.name] = msg.content.slice(1);
			var req = https.request(options, function (res) {
				var chunks = [];

				res.on("data", function (chunk) {
					chunks.push(chunk);
				});

				res.on("end", function (chunk) {
					var body = Buffer.concat(chunks);
					let resExtract = JSON.parse(body.toString());
					//   For debugging
					// console.log(resExtract);
					console.log("ChatGPT : " + resExtract.choices[0].message.content.trim());
					msg.replyText(resExtract.choices[0].message.content.trim());
					allMsg[msg.sender.name] = "";
				});

				res.on("error", function (error) {
					console.error(error);
				});
			});

			var postData = JSON.stringify({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "user",
						content: allMsg[msg.sender.name],
					},
				],
				temperature: 0.7,
			});

			req.write(postData);

			req.end();
		} else if (msg.content.startsWith("+")) {
			if (allMsg[msg.sender.name] == undefined) {
				allMsg[msg.sender.name] = "";
			}
			allMsg[msg.sender.name] += msg.content.slice(1);
			// console.log(allMsg[msg.sender.name]);
			msg.replyText(
				'"+"로 시작하여 이어질 메시지를 추가하세요.\n또는 "초기화"라고 말하면 처음부터 다시 시작합니다.\n"전송"이라고 말하면 지금까지 말한 메시지를 전송합니다.\n\n지금까지 말한 메시지는 다음과 같습니다:\n\n' +
					allMsg[msg.sender.name]
			);
		} else if (
			msg.content == "-" ||
			msg.content == "n" ||
			msg.content == "reset" ||
			msg.content == "리셋" ||
			msg.content == "초기화"
		) {
			allMsg[msg.sender.name] = "";
			msg.replyText(msg.sender.name + "님의 메시지를 초기화했습니다.");
		} else if (
			msg.content == "y" ||
			msg.content == "send" ||
			msg.content == "전송" ||
			msg.content == "보내기"
		) {
			if (
				allMsg[msg.sender.name] != undefined ||
				allMsg[msg.sender.name] != "" ||
				allMsg[msg.sender.name] != null
			) {
				var req = https.request(options, function (res) {
					var chunks = [];

					res.on("data", function (chunk) {
						chunks.push(chunk);
					});

					res.on("end", function (chunk) {
						var body = Buffer.concat(chunks);
						let resExtract = JSON.parse(body.toString());
						//   For debugging
						// console.log(resExtract);
						console.log("ChatGPT : " + resExtract.choices[0].message.content.trim());
						msg.replyText(resExtract.choices[0].message.content.trim());
						allMsg[msg.sender.name] = "";
					});

					res.on("error", function (error) {
						console.error(error);
					});
				});

				var postData = JSON.stringify({
					model: "gpt-3.5-turbo",
					messages: [
						{
							role: "user",
							content: allMsg[msg.sender.name],
						},
					],
					temperature: 0.7,
				});

				req.write(postData);

				req.end();
			} else {
				msg.replyText(msg.sender.name + "님의 이름으로 작업한 메시지가 없습니다.");
			}
		}
	}
});

server.start(process.env.PORT || 3000);
