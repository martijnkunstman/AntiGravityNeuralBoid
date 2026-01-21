export class NeuralNetwork {
    inputNodes: number;
    hiddenNodes: number;
    outputNodes: number;

    weightsIH: Float32Array; // Input -> Hidden
    weightsHO: Float32Array; // Hidden -> Output
    biasH: Float32Array;
    biasO: Float32Array;

    constructor(inputNodes: number, hiddenNodes: number, outputNodes: number) {
        this.inputNodes = inputNodes;
        this.hiddenNodes = hiddenNodes;
        this.outputNodes = outputNodes;

        this.weightsIH = new Float32Array(inputNodes * hiddenNodes);
        this.weightsHO = new Float32Array(hiddenNodes * outputNodes);
        this.biasH = new Float32Array(hiddenNodes);
        this.biasO = new Float32Array(outputNodes);

        this.randomize();
    }

    randomize() {
        for (let i = 0; i < this.weightsIH.length; i++) this.weightsIH[i] = Math.random() * 2 - 1;
        for (let i = 0; i < this.weightsHO.length; i++) this.weightsHO[i] = Math.random() * 2 - 1;
        for (let i = 0; i < this.biasH.length; i++) this.biasH[i] = Math.random() * 2 - 1;
        for (let i = 0; i < this.biasO.length; i++) this.biasO[i] = Math.random() * 2 - 1;
    }

    predict(inputs: number[]): number[] {
        if (inputs.length !== this.inputNodes) {
            console.error(`Input count mismatch. Expected ${this.inputNodes}, got ${inputs.length}`);
            return new Array(this.outputNodes).fill(0);
        }

        // Hidden Layer
        const hidden = new Float32Array(this.hiddenNodes);
        for (let j = 0; j < this.hiddenNodes; j++) {
            let sum = 0;
            for (let i = 0; i < this.inputNodes; i++) {
                sum += inputs[i] * this.weightsIH[i * this.hiddenNodes + j]; // Logic: input i connects to hidden j? 
                // Matrix math usually: weights[j][i] * input[i]. 
                // Let's assume flat array is row-major or similar. 
                // Indexing: Input I to Hidden J. Offset J + I * HiddenCount?
                // Standard convention: weights[j * inputs + i]?
                // Let's stick to simple loops.
            }
            // Wait, standard Matrix multiplication: H = W_ih * I + B_h
            // W_ih dimensions: Hidden x Input
            // Index = j * inputNodes + i
            sum = this.biasH[j];
            for (let i = 0; i < this.inputNodes; i++) {
                sum += inputs[i] * this.weightsIH[j * this.inputNodes + i];
            }
            hidden[j] = Math.tanh(sum); // Activation
        }

        // Output Layer
        const output = new Array(this.outputNodes);
        for (let k = 0; k < this.outputNodes; k++) {
            let sum = this.biasO[k];
            for (let j = 0; j < this.hiddenNodes; j++) {
                sum += hidden[j] * this.weightsHO[k * this.hiddenNodes + j];
            }
            output[k] = Math.tanh(sum); // Activation -1 to 1 for thrusters (or sigmoid 0 to 1?)
            // Thrusters expect 0-1 usually, but -1 to 1 allows reversing? Boid logic clamps 0-1?
            // "make it move around", "two trusters at its back corners"
            // If we output -1 to 1, we can map it. Let's use Tanh.
        }

        return output;
    }

    crossover(partner: NeuralNetwork): NeuralNetwork {
        const child = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);

        const crossoverWeights = (w1: Float32Array, w2: Float32Array, out: Float32Array) => {
            const mid = Math.floor(Math.random() * w1.length);
            for (let i = 0; i < w1.length; i++) {
                out[i] = (i < mid) ? w1[i] : w2[i];
            }
        };

        crossoverWeights(this.weightsIH, partner.weightsIH, child.weightsIH);
        crossoverWeights(this.weightsHO, partner.weightsHO, child.weightsHO);
        crossoverWeights(this.biasH, partner.biasH, child.biasH);
        crossoverWeights(this.biasO, partner.biasO, child.biasO);

        return child;
    }

    mutate(rate: number) {
        const mutateArr = (arr: Float32Array) => {
            for (let i = 0; i < arr.length; i++) {
                if (Math.random() < rate) {
                    arr[i] += (Math.random() * 2 - 1) * 0.5; // Tweak amount
                    // Constrain?
                    if (arr[i] > 1) arr[i] = 1;
                    if (arr[i] < -1) arr[i] = -1;
                }
            }
        };
        mutateArr(this.weightsIH);
        mutateArr(this.weightsHO);
        mutateArr(this.biasH);
        mutateArr(this.biasO);
    }

    // For visualization
    serialize() {
        return {
            weightsIH: Array.from(this.weightsIH),
            weightsHO: Array.from(this.weightsHO),
            biasH: Array.from(this.biasH),
            biasO: Array.from(this.biasO)
        };
    }

    static deserialize(data: any, inputNodes: number, hiddenNodes: number, outputNodes: number): NeuralNetwork {
        const nn = new NeuralNetwork(inputNodes, hiddenNodes, outputNodes);
        nn.weightsIH = Float32Array.from(data.weightsIH);
        nn.weightsHO = Float32Array.from(data.weightsHO);
        nn.biasH = Float32Array.from(data.biasH);
        nn.biasO = Float32Array.from(data.biasO);
        return nn;
    }
}
