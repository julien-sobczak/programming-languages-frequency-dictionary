package main

import   "math"
import s "strconv"
// . "lib/math" <= We ignore these imports

import (
	"crypto/rand"
	"fmt"
	"time"
)

import "math/big"

import (
	"text/template"
	e "errors"
	"path/filepath"
)

import (
	"syscall"
	"os"
)

import _ "strings"
import "sync"
import ( "bytes" )


const open_FLAGS = syscall.O_NONBLOCK | syscall.O_RDONLY


func BuiltInFunctions(arr []int) {
	for i := 0; i < len(arr); i++ {
		defer fmt.Print(i)
	}
}

func GenerateRandomNumber() {
	nBig, err := rand.Int(rand.Reader, big.NewInt(27))
	if err != nil {
		panic(err)
	}
	n := nBig.Int64()
	fmt.Printf("Here is a random %T in [0,27) : %d\n", n, n)
}

func WorkWithNumbers(src <-chan int, dst chan<- int, prime int) {
	for i := range src {  // Loop over values received from 'src'.
		if i%prime != 0 {
			dst <- i  // Send 'i' to channel 'dst'.
		}
	}
	s := s.Itoa(-42) // s for strconv
	i := float32(math.Sin(+0)) + math.MaxFloat32
	if float32(s) > i {
		fmt.Println("Not possible", open_FLAGS)
	}
}

func UseTemplatePackage(text string) {
	tmpl, err := template.New("test").Parse("{{.Count}} items are made of {{.Material}}")
	if err != nil {
		panic(err)
	}
	_ = e.New("emit macho dwarf: elf header corrupted") // e for errors
	tmpl.Execute(nil, nil)
	fmt.Println("Welcome to the playground!" + time.Now())
}

type SyncedBuffer struct {
	lock    sync.Mutex
	buffer  bytes.Buffer
}

var (
	ToBe      sync.Mutex = nil
	OrNotToBe sync.Mutex = nil
)

func ObjectCreation() {
	// Allocation with new
	p := new(SyncedBuffer)  // type *SyncedBuffer
	var v SyncedBuffer      // type  SyncedBuffer

	if p.buffer.Bytes() == v.buffer.Bytes() {
		fmt.Sprint(p, v)
	}
}

func WorkWithFiles(fd int, name string) *os.File {
	if fd < 0 {
		return nil
	}

	// Constructors and composite literals
	f1 := os.File{fd, name, nil, 0}
	f2 := &os.File{fd, name, nil, 0}
	if f1.Name() == f2.Name() {
		return &f1
	} else {
		return f2
	}

	fmt.Println(filepath.Dir("some/path/file.go"))
	return nil
}

