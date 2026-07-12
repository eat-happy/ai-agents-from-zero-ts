"""
【案例】多工具并行调用与聚合回答（V0.3：Agent + AgentExecutor）

对应教程章节：第 21 章 - Agent 智能体 → 3、Agent 工作原理（V0.3）

知识点速览：
- Tool 与 Agent 关系：Tool 提供能力（如查天气），Agent 负责决策「何时用、用哪个、如何聚合结果」。
  本案例中一次问题「北京和上海哪个更热」触发多次工具调用，再由 Agent 汇总比较。
- V0.3 流程：模型 + 工具 + 提示模板 → create_tool_calling_agent 得到 Agent → 用 AgentExecutor 执行，
  对应教程「3、Agent 工作原理（V0.3 视角）」：Agent 只做决策，Executor 负责真正调用工具并把结果传回 Agent。
- 关键组件：ChatPromptTemplate 定义对话结构（含 `agent_scratchpad` 占位符）、AgentExecutor 驱动循环。
- `agent_scratchpad` 可以理解成 Agent 的“草稿区 / 中间步骤区”，没有它，classic 路线下的多步推理就很难成立。
- `AgentExecutor(verbose=True)` 很适合教学和排查，它相当于一个轻量级的执行日志窗口；新版教程里补充的
  `stream()` / LangSmith 则是更偏 1.x 和工程化的观察手段。
- 这个文件的核心价值不是“天气查询”，而是帮助你看清 classic Agent 是如何围绕一次问题完成多次工具调用的。
"""

import json
import os
import httpx
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

from langchain_classic.agents import create_tool_calling_agent
from langchain_classic.agents import AgentExecutor
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool


@tool
def get_weather(loc):
    """
    查询即时天气函数

    :param loc: 必要参数，字符串类型，表示查询天气的城市名称；中国城市需用英文名，如 Beijing、Shanghai。
    :return: OpenWeather API 返回的天气信息，JSON 序列化后的字符串。
    """
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": loc,
        "appid": os.getenv("OPENWEATHER_API_KEY"),
        "units": "metric",
        "lang": "zh_cn",
    }
    response = httpx.get(url, params=params, timeout=30)
    data = response.json()
    print(json.dumps(data))
    return json.dumps(data)


# 初始化大模型，用于理解用户问题并决定是否调用工具、如何组合结果
llm = ChatOpenAI(
    model="qwen-plus",
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# 定义 Agent 的对话结构：system 定角色，human 为用户输入，
# placeholder 供 Executor 填入中间推理与工具调用记录
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "你是天气助手，请根据用户的问题，给出相应的天气信息"),
        ("human", "{input}"),
        (
            "placeholder",
            "{agent_scratchpad}",
        ),  # V0.3 必备：Agent 的「草稿本」，记录多轮推理与工具输出
    ]
)

tools = [get_weather]

# 将 LLM、工具列表、提示模板组装成「可做工具调用决策」的 Agent（尚未执行）
agent = create_tool_calling_agent(llm, tools, prompt)

# AgentExecutor 负责循环：调用 Agent → 执行其选中的工具 →
# 把结果写回 agent_scratchpad → 再交给 Agent，直到结束
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 一次问题触发多工具调用（北京、上海天气）并聚合回答
result = agent_executor.invoke(
    {"input": "请问今天北京和上海的天气怎么样，哪个城市更热？"}
)

print(result)

"""
【输出示例】
> Entering new AgentExecutor chain...
"""

# Invoking: `get_weather` with `{'loc': 'Beijing'}`


# {"coord": {"lon": 116.3972, "lat": 39.9075}, "weather": [{"id": 804, "main": "Clouds", "description": "\u9634\uff0c\u591a\u4e91", "icon": "04d"}], "base": "stations", "main": {"temp": 10.49, "feels_like": 8.51, "temp_min": 10.49, "temp_max": 10.49, "pressure": 1024, "humidity": 35, "sea_level": 1024, "grnd_level": 1019}, "visibility": 10000, "wind": {"speed": 0.49, "deg": 203, "gust": 0.67}, "clouds": {"all": 100}, "dt": 1773385469, "sys": {"country": "CN", "sunrise": 1773354606, "sunset": 1773397087}, "timezone": 28800, "id": 1816670, "name": "Beijing", "cod": 200}
# {"coord": {"lon": 116.3972, "lat": 39.9075}, "weather": [{"id": 804, "main": "Clouds", "description": "\u9634\uff0c\u591a\u4e91", "icon": "04d"}], "base": "stations", "main": {"temp": 10.49, "feels_like": 8.51, "temp_min": 10.49, "temp_max": 10.49, "pressure": 1024, "humidity": 35, "sea_level": 1024, "grnd_level": 1019}, "visibility": 10000, "wind": {"speed": 0.49, "deg": 203, "gust": 0.67}, "clouds": {"all": 100}, "dt": 1773385469, "sys": {"country": "CN", "sunrise": 1773354606, "sunset": 1773397087}, "timezone": 28800, "id": 1816670, "name": "Beijing", "cod": 200}
# Invoking: `get_weather` with `{'loc': 'Shanghai'}`


# {"coord": {"lon": 121.4581, "lat": 31.2222}, "weather": [{"id": 800, "main": "Clear", "description": "\u6674", "icon": "01d"}], "base": "stations", "main": {"temp": 15.34, "feels_like": 13.5, "temp_min": 15.34, "temp_max": 15.34, "pressure": 1027, "humidity": 22, "sea_level": 1027, "grnd_level": 1026}, "visibility": 10000, "wind": {"speed": 3.06, "deg": 84, "gust": 2.32}, "clouds": {"all": 0}, "dt": 1773385631, "sys": {"country": "CN", "sunrise": 1773353249, "sunset": 1773396016}, "timezone": 28800, "id": 1796236, "name": "Shanghai", "cod": 200}
# {"coord": {"lon": 121.4581, "lat": 31.2222}, "weather": [{"id": 800, "main": "Clear", "description": "\u6674", "icon": "01d"}], "base": "stations", "main": {"temp": 15.34, "feels_like": 13.5, "temp_min": 15.34, "temp_max": 15.34, "pressure": 1027, "humidity": 22, "sea_level": 1027, "grnd_level": 1026}, "visibility": 10000, "wind": {"speed": 3.06, "deg": 84, "gust": 2.32}, "clouds": {"all": 0}, "dt": 1773385631, "sys": {"country": "CN", "sunrise": 1773353249, "sunset": 1773396016}, "timezone": 28800, "id": 1796236, "name": "Shanghai", "cod": 200}今天北京和上海的天气情况如下：

# - **北京**：阴，多云，当前气温为 **10.49°C**，体感温度约 **8.51°C**，湿度较低（35%），风速较小（0.49 m/s）。
# - **上海**：晴，当前气温为 **15.34°C**，体感温度约 **13.5°C**，湿度更低（22%），风速稍大（3.06 m/s），天空无云。

# **对比来看，上海更热**，当前气温比北京高约 **4.85°C**，且阳光充足，体感也更温暖。

# 如需未来几天预报或穿衣建议，欢迎随时告诉我！ 😊

# > Finished chain.
# {'input': '请问今天北京和上海的天气怎么样，哪个城市更热？', 'output': '今天北京和上海的天气情况如下：\n\n- **北京**：阴，多云，当前气温为 **10.49°C**，体感温度约 **8.51°C**，湿度较低（35%），风速较小（0.49 m/s）。\n- **上海**：晴，当前气温为 **15.34°C**，体感温度约 **13.5°C**，湿度更低（22%），风速稍大（3.06 m/s），天空无云。\n\n**对比来看，上海更热**，当前气温比北京高约 **4.85°C**，且阳光充足，体感也更温暖。\n\n如需未来几天预报或穿衣建议，欢迎随时告诉我！ 😊'}
