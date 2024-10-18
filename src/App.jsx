/* eslint-disable */
import { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  getBezierPath,
  EdgeText,
} from "reactflow";
import "reactflow/dist/style.css";

// Custom node component
function CustomNode({ data, isConnectable }) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded p-2 shadow-md relative">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <button
        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md transition-colors duration-200"
        onClick={data.onNodeDelete}
        title="Delete Node"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <input
        className="font-bold mb-2 w-full border border-gray-300 rounded px-2 py-1"
        value={data.label}
        onChange={(evt) => data.onLabelChange(evt.target.value)}
      />
      {data.behaviors.map((behavior, index) => (
        <div key={index} className="flex items-center mb-1">
          <input
            className="flex-grow mr-2 border border-gray-300 rounded px-2 py-1"
            value={behavior}
            onChange={(evt) => data.onBehaviorChange(index, evt.target.value)}
          />
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => data.onBehaviorDelete(index)}
          >
            X
          </button>
        </div>
      ))}
      <button
        className="bg-blue-500 text-white px-2 py-1 rounded mt-2"
        onClick={data.onBehaviorAdd}
      >
        Add Behavior
      </button>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
      />
      <EdgeText
        x={labelX}
        y={labelY}
        label={data.label}
        labelStyle={{ fill: "black", fontWeight: 700 }}
        labelShowBg
        labelBgStyle={{ fill: "white" }}
        labelBgPadding={[2, 4]}
        labelBgBorderRadius={2}
      />
    </>
  );
};

const edgeTypes = {
  custom: CustomEdge,
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [jsonResult, setJsonResult] = useState("{}");
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [selectedEdges, setSelectedEdges] = useState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const updateJsonResult = useCallback(() => {
    const result = nodes.reduce((acc, node) => {
      const connectedNodes = edges.reduce((connections, edge) => {
        if (edge.source === node.id) {
          const targetNode = nodes.find((n) => n.id === edge.target);
          connections.push(targetNode.data.label);
        } else if (edge.target === node.id && !edge.data?.bidirectional) {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          connections.push(sourceNode.data.label);
        }
        return connections;
      }, []);

      acc[node.data.label] = [
        ...new Set([...connectedNodes, ...node.data.behaviors]),
      ];
      return acc;
    }, {});
    setJsonResult(JSON.stringify(result, null, 2));
  }, [nodes, edges]);

  const onNodeDragStop = useCallback(() => {
    updateJsonResult();
  }, [updateJsonResult]);

  const onLabelChange = useCallback(
    (nodeId, newLabel) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            node.data = { ...node.data, label: newLabel };
          }
          return node;
        })
      );
      updateJsonResult();
    },
    [setNodes, updateJsonResult]
  );

  const onBehaviorChange = useCallback(
    (nodeId, index, newBehavior) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const newBehaviors = [...node.data.behaviors];
            newBehaviors[index] = newBehavior;
            node.data = { ...node.data, behaviors: newBehaviors };
          }
          return node;
        })
      );
      updateJsonResult();
    },
    [setNodes, updateJsonResult]
  );

  const onBehaviorDelete = useCallback(
    (nodeId, index) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const newBehaviors = [...node.data.behaviors];
            newBehaviors.splice(index, 1);
            node.data = { ...node.data, behaviors: newBehaviors };
          }
          return node;
        })
      );
      updateJsonResult();
    },
    [setNodes, updateJsonResult]
  );

  const onBehaviorAdd = useCallback(
    (nodeId) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const newBehaviors = [...node.data.behaviors, ""];
            node.data = { ...node.data, behaviors: newBehaviors };
          }
          return node;
        })
      );
      updateJsonResult();
    },
    [setNodes, updateJsonResult]
  );

  const addNewNode = useCallback(() => {
    const newNode = {
      id: `${nodeIdCounter}`,
      type: "custom",
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: { label: `Node ${nodeIdCounter}`, behaviors: [] },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter((prevCounter) => prevCounter + 1);
    updateJsonResult();
  }, [nodeIdCounter, setNodes, updateJsonResult]);

  const onSelectionChange = useCallback((params) => {
    setSelectedEdges(params.edges);
  }, []);

  const deleteSelectedEdges = useCallback(() => {
    if (selectedEdges.length > 0) {
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !selectedEdges.some((selectedEdge) => selectedEdge.id === edge.id)
        )
      );
      setSelectedEdges([]);
      updateJsonResult();
    }
  }, [selectedEdges, setEdges, updateJsonResult]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelectedEdges();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteSelectedEdges]);

  const updateGraphFromJson = useCallback(
    (jsonString) => {
      try {
        const parsedJson = JSON.parse(jsonString);
        const newNodes = [];
        const newEdges = [];
        let maxId = 0;

        Object.entries(parsedJson).forEach(([nodeName, connections], index) => {
          const nodeId = `${index + 1}`;
          maxId = Math.max(maxId, parseInt(nodeId));

          newNodes.push({
            id: nodeId,
            type: "custom",
            position: { x: Math.random() * 500, y: Math.random() * 500 },
            data: {
              label: nodeName,
              behaviors: connections.filter(
                (conn) => !Object.keys(parsedJson).includes(conn)
              ),
            },
          });
        });

        // Create edges after all nodes are created
        Object.entries(parsedJson).forEach(
          ([nodeName, connections], sourceIndex) => {
            const sourceId = `${sourceIndex + 1}`;
            connections.forEach((conn) => {
              if (Object.keys(parsedJson).includes(conn)) {
                const targetIndex = Object.keys(parsedJson).indexOf(conn);
                const targetId = `${targetIndex + 1}`;
                // Only create edge if source index is less than target index
                // This ensures we only create one edge between each pair of nodes
                if (sourceIndex < targetIndex) {
                  newEdges.push({
                    id: `e${sourceId}-${targetId}`,
                    source: sourceId,
                    target: targetId,
                  });
                }
              }
            });
          }
        );

        setNodes(newNodes);
        setEdges(newEdges);
        setNodeIdCounter(maxId + 1);
      } catch (error) {
        console.error("Invalid JSON:", error);
      }
    },
    [setNodes, setEdges]
  );

  const handleJsonChange = useCallback(
    (event) => {
      const newJsonString = event.target.value;
      setJsonResult(newJsonString);
      updateGraphFromJson(newJsonString);
    },
    [updateGraphFromJson]
  );

  const onNodeDelete = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      updateJsonResult();
    },
    [setNodes, setEdges, updateJsonResult]
  );

  // Update node data with callback functions
  const nodesWithCallbacks = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onLabelChange: (newLabel) => onLabelChange(node.id, newLabel),
      onBehaviorChange: (index, newBehavior) =>
        onBehaviorChange(node.id, index, newBehavior),
      onBehaviorDelete: (index) => onBehaviorDelete(node.id, index),
      onBehaviorAdd: () => onBehaviorAdd(node.id),
      onNodeDelete: () => onNodeDelete(node.id),
    },
  }));

  return (
    <div className="flex h-screen">
      <div className="w-[70%] h-full relative">
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          selectNodesOnDrag={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
        <button
          className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded"
          onClick={addNewNode}
        >
          Add Node
        </button>
      </div>
      <div className="w-[30%] h-full bg-gray-100 p-4 overflow-auto">
        <h2 className="text-2xl font-bold mb-4">JSON Result</h2>
        <textarea
          className="w-full h-[calc(100%-3rem)] p-4 font-mono text-sm border border-gray-300 rounded"
          value={jsonResult}
          onChange={handleJsonChange}
        />
      </div>
    </div>
  );
}

export default App;
