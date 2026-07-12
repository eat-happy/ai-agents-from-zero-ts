"""
【案例】本地 MCP 天气客户端（直接调用服务端已注册工具）

对应教程章节：第 20 章 - MCP 模型上下文协议 → 6、案例实战：本地 MCP 天气服务与客户端

知识点速览：
- MCP 客户端的职责是“连接服务端、发现能力、发起调用”；真实项目里一个客户端可以连接一个或多个
  MCP 服务，本案例只是为了教学演示，先从最简单的单服务端开始。
- 本案例为「同机、同进程演示」：客户端通过 Python 的 `from McpServer import mcp` 直接拿到服务端的
  mcp 实例，再用 mcp._tools 调用已注册工具，并没有走真实的 MCP 协议通信。这样做的目的，是先看懂
  「工具暴露 → 能力发现 → 发起调用」这条最小路径，再去理解后面的 FastMCP 与 LangChain 客户端案例。
- 实际生产里，客户端通常会通过 stdio 或 HTTP/Streamable HTTP 连接独立的 MCP 服务；本仓库也保留了
  `sse` 写法作为兼容和教学示例。
- 运行方式：直接运行本文件即可。它会自动导入 McpServer.py 中的 mcp 对象，无需先单独启动服务端进程。
"""

import json
from loguru import logger

# 「连接」方式：通过导入获取服务端的 mcp 对象，直接读取其工具注册表，并非真实网络连接
from McpServer import mcp


class MCPWeatherClient:
    """教学版客户端：直接访问服务端注册表，用来观察最小调用链路。"""

    def __init__(self, mcp_instance):
        self.mcp_instance = mcp_instance
        # 获取服务端已注册的所有工具（字典：工具名 -> 可调用函数）
        # 真实 MCP 客户端不会直接碰 _tools，而是先握手/发现能力，再通过协议发起调用
        self.available_tools = mcp_instance._tools

    def check_tool_availability(self, tool_name: str) -> bool:
        """检查指定工具是否在服务端已注册，避免调用不存在的工具"""
        is_available = tool_name in self.available_tools
        if is_available:
            logger.info(f"工具 '{tool_name}' 可用")
        else:
            logger.warning(f"工具 '{tool_name}' 未在服务端注册")
        return is_available

    def call_get_weather(self, city: str) -> str or None:
        """调用服务端的 get_weather 工具，查询指定城市天气"""
        tool_name = "get_weather"
        if not self.check_tool_availability(tool_name):
            return None

        try:
            # 直接调用服务端已注册的工具函数。
            # 真实项目里，这一步通常由 MCP 客户端经由 stdio 或 HTTP 传输层去完成。
            weather_result = self.available_tools[tool_name](city)
            logger.info(
                f"成功获取 {city} 天气数据，返回结果长度：{len(weather_result)}"
            )
            return weather_result
        except Exception as exc:
            logger.error(f"调用 {tool_name} 工具失败：{str(exc)}")
            return None


def run_client_demo():
    """客户端演示：初始化客户端，依次查询多城市天气并格式化输出"""
    logger.info("初始化 MCP 天气客户端...")
    client = MCPWeatherClient(mcp)

    # 调用天气查询工具（支持 Beijing、Shanghai、Guangzhou 等英文城市名）
    target_cities = ["Beijing", "Shanghai"]
    for city in target_cities:
        logger.info(f"\n========== 查询 {city} 天气 ==========")
        weather_data = client.call_get_weather(city)
        if weather_data:
            # 格式化输出结果（可选，方便阅读）
            formatted_data = json.dumps(
                json.loads(weather_data), indent=4, ensure_ascii=False
            )
            print(f"格式化天气结果：\n{formatted_data}")
        print("-" * 50)


if __name__ == "__main__":
    logger.info("启动 MCP 天气客户端...")
    run_client_demo()

"""
【输出示例】
2026-03-13 11:09:46.119 | INFO     | __main__:<module>:75 - 启动 MCP 天气客户端...
2026-03-13 11:09:46.119 | INFO     | __main__:run_client_demo:57 - 初始化 MCP 天气客户端...
2026-03-13 11:09:46.119 | INFO     | __main__:run_client_demo:63 -
========== 查询 Beijing 天气 ==========
2026-03-13 11:09:46.119 | INFO     | __main__:check_tool_availability:32 - 工具 'get_weather' 可用
2026-03-13 11:09:46.830 | INFO     | McpServer:get_weather:84 - 查询 Beijing 天气结果：{'coord': {'lon': 116.3972, 'lat': 39.9075}, 'weather': [{'id': 804, 'main': 'Clouds', 'description': '阴，多云', 'icon': '04d'}], 'base': 'stations', 'main': {'temp': 4.94, 'feels_like': 4.03, 'temp_min': 4.94, 'temp_max': 4.94, 'pressure': 1027, 'humidity': 41, 'sea_level': 1027, 'grnd_level': 1021}, 'visibility': 10000, 'wind': {'speed': 1.39, 'deg': 6, 'gust': 1.02}, 'clouds': {'all': 100}, 'dt': 1773371280, 'sys': {'type': 1, 'id': 9609, 'country': 'CN', 'sunrise': 1773354606, 'sunset': 1773397087}, 'timezone': 28800, 'id': 1816670, 'name': 'Beijing', 'cod': 200}
2026-03-13 11:09:46.830 | INFO     | __main__:call_get_weather:46 - 成功获取 Beijing 天气数据，返回结果长度：570
格式化天气结果：
{
    "coord": {
        "lon": 116.3972,
        "lat": 39.9075
    },
    "weather": [
        {
            "id": 804,
            "main": "Clouds",
            "description": "阴，多云",
            "icon": "04d"
        }
    ],
    "base": "stations",
    "main": {
        "temp": 4.94,
        "feels_like": 4.03,
        "temp_min": 4.94,
        "temp_max": 4.94,
        "pressure": 1027,
        "humidity": 41,
        "sea_level": 1027,
        "grnd_level": 1021
    },
    "visibility": 10000,
    "wind": {
        "speed": 1.39,
        "deg": 6,
        "gust": 1.02
    },
    "clouds": {
        "all": 100
    },
    "dt": 1773371280,
    "sys": {
        "type": 1,
        "id": 9609,
        "country": "CN",
        "sunrise": 1773354606,
        "sunset": 1773397087
    },
    "timezone": 28800,
    "id": 1816670,
    "name": "Beijing",
    "cod": 200
}
"""
