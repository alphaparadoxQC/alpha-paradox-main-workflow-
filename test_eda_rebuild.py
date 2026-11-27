import sys
sys.path.append('composer/backend')

from pydantic import BaseModel
class EdaState(BaseModel):
    components: list
    chips: dict

from eda_router import rebuild_design, EdaState
import asyncio

state = EdaState(
    components=[
        {
            "id": 1,
            "type": "tunable_coupler_01",
            "name": "TC1",
            "params": {
                "pos_x": "0um",
                "pos_y": "0um"
            }
        },
        {
            "id": 2,
            "type": "resonator_lumped",
            "name": "RL1",
            "params": {}
        }
    ],
    chips={"main": {}}
)

async def test():
    try:
        res = await rebuild_design(state)
        print("Success:")
        print(res)
    except Exception as e:
        print("Error:")
        print(e)

asyncio.run(test())
