interface Queue<T>{
    enqueue(item: any): void
    dequeue():T
    peek(): T
    size(): number
    isEmpty(): boolean
}


export class QueueImpl<T> implements Queue<T>{
    private queue: T[] = []
 


    enqueue(item: any): void {
        this.queue.push(item)
    }

    dequeue(): any {
        return this.queue.shift()
    }

    peek(): T {
        return this.queue[0]
    }

    size(): number {
        return this.queue.length
    }

    isEmpty(): boolean {
        return this.queue.length === 0
    }

    static fromArray<T>(array: T[]): QueueImpl<T> {
        const queue = new QueueImpl<T>()
        for(const item of array) {
            queue.enqueue(item)
        }
        return queue
    }

}



export default Queue